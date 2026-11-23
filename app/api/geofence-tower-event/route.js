// app/api/geofence-tower-event/route.js
// جديد - على last-update بس - ما بيعدل على شي قديم
// بيستقبل: الزبون دخل برج جديد - وهو مسكر - وبيبعت OneSignal - بنفس طريقتك القديمة

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { findTowerForLocation, isTowerChange } from "@/lib/geofence-tower-to-tower.js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, subscriptionId, lat, lng, oldTowerId } = body || {};

    if (!lat || !lng) {
      return NextResponse.json({ success: false, message: "Missing lat/lng" });
    }

    const supabase = getSupabase();

    // 1. جيب الأبراج - من الجدول القديم - قراية بس
    const { data: centers } = await supabase.from("geofence_centers").select("*");
    const tower = findTowerForLocation(Number(lat), Number(lng), centers || []);

    if (!tower) {
      return NextResponse.json({ success: true, inside: false, message: "برا كل الأبراج" });
    }

    const newTowerId = tower.id;
    const towerName = tower.name || tower.Name || "برج جديد";

    // 2. اذا ما انتقل من برج لبرج - ما تبعت شي
    if (!isTowerChange(oldTowerId, newTowerId)) {
      return NextResponse.json({ success: true, changed: false, towerId: newTowerId });
    }

    // 3. شوف اذا بعتنا لهيدا الزبون - لهيدا البرج - اليوم - بجدول جديد geofence_events - مشان ما نبعت مرتين
    const today = new Date().toISOString().slice(0, 10);
    const { data: already } = await supabase
      .from("geofence_events")
      .select("*")
      .eq("user_id", String(userId || ""))
      .eq("tower_id", String(newTowerId))
      .eq("event_date", today)
      .limit(1);

    if (already?.length) {
      return NextResponse.json({ success: true, changed: true, alreadySent: true, towerId: newTowerId });
    }

    // 4. سجل الحدث - بجدول جديد
    await supabase.from("geofence_events").insert([
      {
        user_id: String(userId || ""),
        tower_id: String(newTowerId),
        tower_name: towerName,
        lat: Number(lat),
        lng: Number(lng),
        event_date: today,
        created_at: new Date().toISOString(),
      },
    ]);

    // 5. ابعت OneSignal - بنفس طريقتك القديمة - اللي بتشتغل Super
    let subId = subscriptionId;
    if (!subId && userId) {
      const { data: u } = await supabase
        .from("users")
        .select('"Subscription ID"')
        .eq("Customer ID", String(userId))
        .maybeSingle();
      subId = u?.["Subscription ID"] || null;
    }

    if (subId) {
      await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id: process.env.ONESIGNAL_APP_ID,
          include_subscription_ids: [subId],
          headings: { en: `وصلت على ${towerName} 📍` },
          contents: { en: `أهلا فيك ببرج ${towerName} - شوف عروض هيدا البرج اليوم` },
          data: { type: "TOWER_CHANGE", tower_id: String(newTowerId), tower_name: towerName },
        }),
      });
    }

    return NextResponse.json({ success: true, changed: true, towerId: newTowerId, towerName });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

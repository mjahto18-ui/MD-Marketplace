// app/api/geofence-tower-event/route.js
// جديد - على last-update بس - ما بيعدل على شي قديم
// بيستقبل: الزبون دخل برج جديد - وهو مسكر - وبيبعت OneSignal - بنفس طريقتك القديمة

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { findTowerForLocation, isTowerChange } from "@/lib/geofence-tower-to-tower.js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

const NO_CACHE = { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" };

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, subscriptionId, lat, lng, oldTowerId } = body || {};

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, message: "Missing lat/lng" },
        { headers: NO_CACHE }
      );
    }

    const supabase = getSupabase();

    // 1. جيب الأبراج - من الجدول القديم - قراية بس
    const { data: centers } = await supabase.from("geofence_centers").select("*");
    const tower = findTowerForLocation(Number(lat), Number(lng), centers || []);

    if (!tower) {
      return NextResponse.json(
        { success: true, inside: false, message: "برا كل الأبراج" },
        { headers: NO_CACHE }
      );
    }

    const newTowerId = tower.id;
    const towerName = tower.name || tower.Name || "برج جديد";

    // 2. اذا ما انتقل من برج لبرج - ما تبعت شي
    if (!isTowerChange(oldTowerId, newTowerId)) {
      return NextResponse.json(
        { success: true, changed: false, towerId: newTowerId },
        { headers: NO_CACHE }
      );
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
      return NextResponse.json(
        { success: true, changed: true, alreadySent: true, towerId: newTowerId },
        { headers: NO_CACHE }
      );
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

    // 5. ابعت OneSignal - بنفس طريقتك القديمة - اللي بتشتغل
    // هون بس التصحيح - ما شلنا شي - بس زدنا تعريف subId - وصلحنا القوس
    let subId = subscriptionId;
    let u = null;
    if (!subId && userId) {
      // جرب User ID أول شي - b530c8aa
      const { data: u1 } = await supabase
        .from("users")
        .select("*")
        .eq("User ID", String(userId))
        .maybeSingle();
      u = u1;

      // اذا ما لقى - جرب Customer ID - 5555
      if (!u) {
        const { data: u2 } = await supabase
          .from("users")
          .select("*")
          .eq("Customer ID", String(userId))
          .maybeSingle();
        u = u2;
      }

      if (u && u["Subscription ID"]) {
        const isActive = String(u["Active"] || "").toUpperCase() === "TRUE" || String(u["Active"] || "").toLowerCase() === "active";
        const isStatusActive = String(u["Status"] || "").toLowerCase() === "active";
        if (isActive && isStatusActive) {
          subId = u["Subscription ID"];
        }
      }
      console.log("GEOFENCE_SUBID_FOUND", { userId, hasSub: !!subId, active: u?.["Active"], status: u?.["Status"] });
    }

    if (subId) {
      const oneRes = await fetch("https://api.onesignal.com/notifications?c=push", {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id: process.env.ONESIGNAL_APP_ID,
          include_subscription_ids: [subId],
          headings: { en: `أهلا فيك بمنطقة  ${towerName} 📍` },
          contents: { en: `ما تنسى تطلب اي شي بدك ياه ${towerName} - خدماتنا موجودة حدك وين ما رحت ` },
          web_url: `https://www.md-marketplace.store/?tower=${newTowerId}`,
          data: { type: "TOWER_CHANGE", tower_id: String(newTowerId), tower_name: towerName },
        }),
      });
      const oneJson = await oneRes.json();
      console.log("ONESIGNAL_RES", oneJson);
    } else {
      console.log("GEOFENCE_NO_SUBID", { userId });
    }

    return NextResponse.json(
      { success: true, changed: true, towerId: newTowerId, towerName },
      { headers: NO_CACHE }
    );
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500, headers: NO_CACHE }
    );
  }
}

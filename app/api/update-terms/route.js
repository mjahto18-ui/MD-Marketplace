export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function normalize(phone) {
  let c = String(phone || "").replace(/\D/g, "");
  if (!c) return null;
  if (c.startsWith("961")) return c;
  if (c.startsWith("966")) return c;
  if (c.startsWith("0")) c = c.substring(1);
  if (c.length === 9 && c.startsWith("5")) return "966" + c;
  if (c.length === 10 && c.startsWith("5")) return "966" + c;
  if (c.length === 7 && c.startsWith("3")) return "961" + c;
  if (c.length === 8) return "961" + c;
  return c;
}

export async function POST(request) {
  try {
    const { AcceptedTerms } = await request.json();
    const cookie = request.headers.get("cookie");
    const raw = cookie?.match(/session=([^;]+)/)?.[1];
    if (!raw) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const decoded = decodeURIComponent(raw);
    const sessionData = JSON.parse(decoded);
    const phoneRaw = String(sessionData.phone || "").trim();
    const phoneNorm = normalize(phoneRaw);

    console.log("📥 ACCEPT TERMS raw:", phoneRaw, "norm:", phoneNorm);

    const supabase = getSupabase();

    // جيب كل المستخدمين ودور بـ normalize متل البوت - هيك مستحيل ما يلاقي
    const { data: allUsers, error: fetchErr } = await supabase.from('users').select('*');
    if (fetchErr) throw fetchErr;

    let targetUser = null;
    for (const u of allUsers || []) {
      const mobNorm = normalize(u["Mobile"] || "");
      const waNorm = normalize(u["WhatsApp Number"] || "");
      if (mobNorm === phoneNorm || waNorm === phoneNorm || String(u["Mobile"]||"").trim() === phoneRaw || String(u["WhatsApp Number"]||"").trim() === phoneRaw) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      console.error("❌ User not found for", phoneRaw, phoneNorm);
      return NextResponse.json({ error: "User not found", phone: phoneRaw, normalized: phoneNorm }, { status: 404 });
    }

    console.log("✅ لقى المستخدم:", targetUser["User ID"], targetUser["Mobile"], targetUser["WhatsApp Number"]);

    const valueToSave = AcceptedTerms? "TRUE" : "FALSE";

    // حدث بـ User ID يلي هو المفتاح الأساسي - مستحيل يفشل
    const { data, error } = await supabase.from('users').update({
      "AcceptedTerms": valueToSave
    }).eq('User ID', targetUser["User ID"]).select();

    if (error) throw error;

    console.log("✅ AcceptedTerms انكتب:", valueToSave, "للمستخدم", targetUser["User ID"], "نتيجة:", data?.length);

    const newSession = {...sessionData, AcceptedTerms: true, acceptedTerms: true };
    const response = NextResponse.json({ success: true, updated: data?.[0]?.["User ID"] });

    response.cookies.set('session', JSON.stringify(newSession), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });

    return response;

  } catch (err) {
    console.error("UPDATE TERMS ERROR:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}

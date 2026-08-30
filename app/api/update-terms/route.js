export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
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
    const phone = sessionData.phone;

    const supabase = getSupabase();

    // Users!A:R find row[4] === phone
    const { data: rows } = await supabase.from('users').select('*');
    const userRow = (rows||[]).find((row) => String(row['mobile'] || row['Mobile'] || row[4] || "").trim() === String(phone).trim());

    if (!userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valueToSave = AcceptedTerms? "TRUE" : "FALSE";

    // Users!R = AcceptedTerms [17] - صغيرة
    await supabase.from('users').update({
      "accepted_terms": valueToSave === "TRUE",
      "Accepted Terms": valueToSave,
      "accepted_terms_str": valueToSave
    }).eq('mobile', String(phone).trim());

    await supabase.from('users').update({
      "accepted_terms": valueToSave === "TRUE",
      "Accepted Terms": valueToSave
    }).eq('Mobile', String(phone).trim());

    // *** الحل هون - حدث الـ session ***
    const newSession = {...sessionData, AcceptedTerms: true, acceptedTerms: true };
    const response = NextResponse.json({ success: true });

    response.cookies.set('session', JSON.stringify(newSession), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });

    return response;

  } catch (err) {
    console.error("UPDATE TERMS ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("Missing Supabase URL");
  return createClient(url, key);
}

export async function POST(request) {
  try {
    const { AcceptedTerms } = await request.json();

    // ✅ منقرا admin_session مش session
    const cookie = request.headers.get("cookie");
    const raw = cookie?.match(/admin_session=([^;]+)/)?.[1];

    if (!raw) {
      return NextResponse.json({ error: "No admin session" }, { status: 401 });
    }

    const decoded = decodeURIComponent(raw);
    const sessionData = JSON.parse(decoded);
    const userId = sessionData.userId;

    if (!userId) {
      return NextResponse.json({ error: "Invalid session data" }, { status: 401 });
    }

    const supabase = getSupabase();
    const valueToSave = AcceptedTerms? "TRUE" : "FALSE";

    // ✅ مباشر بـ User ID بدون ما نجيب كل الجدول
    const { error } = await supabase
     .from('users')
     .update({ "AcceptedTerms": valueToSave })
     .eq('"User ID"', userId);

    if (error) throw error;

    // ✅ حدث الكوكي القديم
    const newSession = {
     ...sessionData,
      AcceptedTerms: "TRUE",
      acceptedTerms: "TRUE"
    };

    const response = NextResponse.json({
      success: true,
      role: sessionData.role,
      redirectTo:
        sessionData.role === 'Store Owner'? '/store-owner' :
        sessionData.role === 'Driver'? '/driver-owner' :
        sessionData.role === 'Taxi Driver'? '/taxi-driver' :
        '/admin'
    });

    response.cookies.set('admin_session', JSON.stringify(newSession), {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8
    });

    return response;

  } catch (err) {
    console.error("ADMIN UPDATE TERMS ERROR:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}

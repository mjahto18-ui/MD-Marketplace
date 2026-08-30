export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("===== OneSignal Webhook =====");
    console.log(body);
    console.log(JSON.stringify(body, null, 2));

    // -----------------------------
    // Extract Data From OneSignal - نفس المنطق
    // -----------------------------
    const customerId = body?.notification?.target?.user?.id;
    const title = body?.notification?.headings?.en || "";
    const message = body?.notification?.contents?.en || "";
    const image = body?.notification?.chrome_web_image || "";
    const date = new Date().toLocaleString("en-US");

    if (!customerId) {
      return NextResponse.json({
        success: false,
        message: "Missing customerId",
      });
    }

    const supabase = getSupabase();

    // -----------------------------
    // Insert Notification - Supabase
    // -----------------------------
    await supabase.from('webhook').insert([{
      "Customer ID": customerId,
      "Title": title,
      "Message": message,
      "Image": image,
      "Date": date,
      "customer_id": customerId,
      "title": title,
      "message": message,
      "image": image,
      "date": date,
      "created_at": new Date().toISOString()
    }]);

    return NextResponse.json({
      success: true,
      message: "Notification saved",
    });

  } catch (err) {
    console.log(err);
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const APP_ID = process.env.APPSHEET_APP_ID;
const API_KEY = process.env.APPSHEET_API_KEY;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

async function getLastCaseID() {
  const supabase = getSupabase();
  const { data } = await supabase.from('protection_cases').select('"Case ID", case_id').order('created_at', { ascending: false }).limit(1);
  if (!data?.length) return "REF-000000";
  return data[0]['Case ID'] || data[0]['case_id'] || "REF-000000";
}

function generateCaseID(lastID) {
  const number = parseInt(String(lastID).replace("REF-", ""), 10) + 1;
  return `REF-${String(number).padStart(6, "0")}`;
}

// من Supabase بدل Sheets
async function getCustomerName(phone) {
  const supabase = getSupabase();
  const { data } = await supabase.from('users').select('*').eq('Mobile', String(phone).trim()).limit(1);
  if (data?.[0]) return data[0]['Name'] || data[0]['name'] || "زائر";

  const { data: data2 } = await supabase.from('users').select('*').eq('mobile', String(phone).trim()).limit(1);
  if (data2?.[0]) return data2[0]['Name'] || data2[0]['name'] || "زائر";

  return "زائر";
}

export async function POST(req) {
  try {
    const body = await req.json();

    const lastID = await getLastCaseID();
    const caseID = generateCaseID(lastID);
    const customerName = await getCustomerName(body.whatsapp);

    console.log("Creating case:", caseID, "for", customerName);

    // 🔥 الكتابة عن طريق AppSheet مشان الصور تضل محفوظة بـ Google Drive
    const res = await fetch(`https://api.appsheet.com/api/v2/apps/${APP_ID}/tables/Protection Cases/Action`, {
      method: "POST",
      headers: {
        "ApplicationAccessKey": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Action: "Add",
        Properties: { Locale: "en-US" },
        Rows: [{
          "Case ID": caseID,
          "Order ID": body.orderId || "",
          "Customer ID": customerName,
          "Store ID": body.storeId || "",
          "Driver ID": body.driverId || "",
          "Case Type": body.caseType || "",
          "Description": body.description || "",
          "Photo 1": body.photo1 || "",
          "Photo 2": body.photo2 || "",
          "Photo 3": body.photo3 || "",
          "Status": "Pending",
          "Decision": "",
          "Refund Amount": "",
          "Admin Note": "",
          "WhatsApp Chat": body.whatsapp || "",
          "Created Date": new Date().toISOString(),
          "Close Date": ""
        }]
      })
    });

    const text = await res.text();
    console.log("AppSheet:", res.status, text);
    if (!res.ok) throw new Error(text);

    // وكمان اكتب نسخة بـ Supabase للـ last update
    try {
      const supabase = getSupabase();
      await supabase.from('protection_cases').insert([{
        "Case ID": caseID,
        "case_id": caseID,
        "Order ID": body.orderId || "",
        "Customer ID": customerName,
        "Store ID": body.storeId || "",
        "Driver ID": body.driverId || "",
        "Case Type": body.caseType || "",
        "Description": body.description || "",
        "Status": "Pending",
        "WhatsApp Chat": body.whatsapp || "",
        "Created Date": new Date().toISOString(),
        "created_at": new Date().toISOString()
      }]);
    } catch(e) { console.log("Supabase backup insert failed", e.message) }

    return NextResponse.json({ success: true, caseID, message: "تم إرسال البلاغ بنجاح" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

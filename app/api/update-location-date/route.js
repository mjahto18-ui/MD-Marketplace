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
    const { customerID } = await req.json();
    const supabase = getSupabase();

    // جلب كل العملاء - نفس findIndex r[0] === customerID
    const { data: rows } = await supabase.from('customers').select('*');
    const rowIndex = (rows||[]).findIndex(r => String(r['customer_id'] || r['Customer ID'] || r[0] || "").trim() === String(customerID).trim());

    if (rowIndex === -1) {
      return NextResponse.json({ ok: false, msg: "Customer not found" });
    }

    // عمود Last Location Update هو آخر عمود - نفس المنطق
    await supabase.from('customers').update({
      "last_location_update": new Date().toLocaleDateString("en-US"),
      "Last Location Update": new Date().toLocaleDateString("en-US"),
      "last_location_update_iso": new Date().toISOString()
    }).eq('customer_id', String(customerID).trim());

    // fallback capital
    await supabase.from('customers').update({
      "Last Location Update": new Date().toLocaleDateString("en-US"),
      "last_location_update": new Date().toLocaleDateString("en-US")
    }).eq('Customer ID', String(customerID).trim());

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false });
  }
}

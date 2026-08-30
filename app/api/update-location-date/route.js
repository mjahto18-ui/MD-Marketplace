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

    const { data: rows } = await supabase.from('customers').select('"Customer ID"').eq('Customer ID', String(customerID).trim()).limit(1);

    if (!rows?.length) {
      return NextResponse.json({ ok: false, msg: "Customer not found" });
    }

    const { error } = await supabase.from('customers').update({
      "Last Location Update": new Date().toISOString()
    }).eq('Customer ID', String(customerID).trim());

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

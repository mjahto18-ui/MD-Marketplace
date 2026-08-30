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
    const { customerID, lat, lng } = await req.json();
    const supabase = getSupabase();

    const { error } = await supabase.from('customers').update({
      "Current Latitude": String(lat),
      "Current Longtitude": String(lng), // متل ما هي مكتوبة بجدولك حتى لو فيها غلطة
      "Last Location Update": new Date().toLocaleDateString("en-US")
    }).eq('Customer ID', String(customerID).trim());

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

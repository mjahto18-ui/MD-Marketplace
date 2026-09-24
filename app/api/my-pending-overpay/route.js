export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key, {
    global: { fetch: (input, init) => fetch(input, {...init, cache: 'no-store' }) },
    auth: { persistSession: false },
  });
}

export async function GET(req) {
  try {
    const customerID = req.nextUrl.searchParams.get("customerID");
    if (!customerID) return NextResponse.json({ success: true, pendings: [] });

    const supabase = getSupabase();
    const custIdLower = customerID.toString().trim().toLowerCase();

    const { data, error } = await supabase
      .from('pending_overpay')
      .select('"Pending ID", "Request ID", "Customer ID", "Net", "Status"')
      .eq('Status', 'Pending');

    if (error) return NextResponse.json({ success: false, pendings: [] });

    const pendings = (data || []).filter(r => 
      String(r['Customer ID'] || '').trim().toLowerCase() === custIdLower
    );

    return NextResponse.json({ success: true, pendings });
  } catch (e) {
    return NextResponse.json({ success: false, pendings: [] });
  }
}

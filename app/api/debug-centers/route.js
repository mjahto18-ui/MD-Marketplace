export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('geofence_centers').select('*');
  const { data: dataActive, error: errorActive } = await supabase.from('geofence_centers').select('*').eq('is_active', true).eq('cart_enabled', true);

  return NextResponse.json({
    all_count: data?.length || 0,
    all: data,
    error_all: error,
    active_count: dataActive?.length || 0,
    active: dataActive,
    error_active: errorActive,
  });
}

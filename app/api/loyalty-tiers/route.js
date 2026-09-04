export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key, {
    global: {
      fetch: (input, init) => {
        return fetch(input, { ...init, cache: 'no-store' });
      }
    }
  });
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('loyalty_tiers')
      .select('*')
      .eq('is_active', true)
      .order('tier_level', { ascending: true });

    if (error) throw error;

    return NextResponse.json(
      { tiers: data || [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (e) {
    return NextResponse.json(
      { tiers: [], error: e.message },
      {
        headers: { 'Cache-Control': 'no-store' }
      }
    );
  }
}

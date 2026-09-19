export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });
  const supabase = getSupabase();
  const { data, error } = await supabase.from('taxi_orders').select('*').eq('id', id).single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ order: data });
}

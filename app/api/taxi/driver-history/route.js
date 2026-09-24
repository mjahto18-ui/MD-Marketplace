export const dynamic = "force-dynamic";
export const revalidate = 0;
import { createClient } from "@supabase/supabase-js";
function getSupabase(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}
export async function GET(req){
  const { searchParams } = new URL(req.url);
  const taxi_id = searchParams.get('taxi_id');
  const page = Number(searchParams.get('page') || 1);
  const limit = 20;
  const from = (page-1)*limit;
  const to = from + limit - 1;
  if(!taxi_id) return new Response(JSON.stringify({orders:[]}), {status:400});
  const supabase = getSupabase();
  const { data, count } = await supabase.from('taxi_orders')
    .select('*', { count: 'exact' })
    .eq('taxi_id', taxi_id)
    .in('status', ['completed','cancelled','expired'])
    .order('created_at', { ascending: false })
    .range(from, to);
  return new Response(JSON.stringify({orders: data || [], total: count || 0, page}), {
    headers:{'Content-Type':'application/json', 'Cache-Control':'no-store'}
  });
}

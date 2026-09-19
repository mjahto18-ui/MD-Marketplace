export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}
export async function GET(req){
  const { searchParams } = new URL(req.url);
  const customer_id = searchParams.get('customer_id');
  if(!customer_id) return Response.json({orders:[]});
  const supabase = getSupabase();
  const { data } = await supabase.from('taxi_orders')
   .select('*')
   .eq('customer_id', customer_id)
   .in('status',['pending','draft','accepted','on_the_way','arrived'])
   .order('created_at',{ascending:false});
  return Response.json({orders: data || []});
}

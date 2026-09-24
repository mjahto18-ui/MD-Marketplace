export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req){
  const { searchParams } = new URL(req.url);
  const customer_id = searchParams.get('customer_id');
  if(!customer_id) return new Response(JSON.stringify({orders:[]}), { headers: { 'Cache-Control': 'no-store' }});

  const supabase = getSupabase();
  // ✅ ضفنا code_verified و in_progress - هدول اللي كانوا يخلو الرحلة تختفي بعد الكود
  const { data } = await supabase
  .from('taxi_orders')
  .select('*')
  .eq('customer_id', customer_id)
  .in('status',['pending','draft','accepted','on_the_way','arrived','code_verified','in_progress'])
  .order('created_at',{ascending:false});

  return new Response(JSON.stringify({orders: data || []}), {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store'
    }
  });
}

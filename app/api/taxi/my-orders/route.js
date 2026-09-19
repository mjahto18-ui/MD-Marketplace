export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // مهم: no cache للـ supabase client
  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });
}

export async function GET(req){
  const { searchParams } = new URL(req.url);
  const customer_id = searchParams.get('customer_id');
  if(!customer_id) {
    return new Response(JSON.stringify({orders:[]}), {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  }
  
  const supabase = getSupabase();
  
  // جيب مباشرة بدون كاش
  const { data, error } = await supabase
   .from('taxi_orders')
   .select('*')
   .eq('customer_id', customer_id)
   .in('status',['pending','draft','accepted','on_the_way','arrived'])
   .order('created_at',{ascending:false});

  if(error){
    console.log('my-orders error:', error);
  }

  return new Response(JSON.stringify({orders: data || []}), {
    headers: { 
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store'
    }
  });
}

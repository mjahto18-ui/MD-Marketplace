export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { createClient } from "@supabase/supabase-js";

function getSupabase(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(){
  const supabase = getSupabase();
  const cutoff = new Date(Date.now() - 30*60*1000).toISOString();

  // حول كل pending قديم لـ expired
  const { data, error } = await supabase
    .from('taxi_orders')
    .update({ 
      status: 'expired',
      updated_at: new Date().toISOString()
    })
    .eq('status','pending')
    .is('taxi_id', null)
    .lt('created_at', cutoff)
    .select('id, order_code');

  if(error){
    return Response.json({ success:false, error: error.message }, { status:500 });
  }

  return Response.json({ 
    success:true, 
    expired_count: data?.length || 0,
    expired: data || []
  }, {
    headers: { 'Cache-Control':'no-store' }
  });
}

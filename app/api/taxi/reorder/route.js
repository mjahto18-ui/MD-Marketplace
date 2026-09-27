export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";

function getSupabase(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req){
  const { order_id } = await req.json();
  if(!order_id) return Response.json({success:false}, {status:400});

  const supabase = getSupabase();

  const { data: old } = await supabase.from('taxi_orders').select('id,status').eq('id', order_id).single();
  if(!old || old.status !== 'expired') return Response.json({success:false, error:'not expired'},{status:400});

  const { error } = await supabase.from('taxi_orders').update({
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    taxi_id: null,
    taxi_name: null,
    taxi_phone: null,
    taxi_plate_number: null,
    taxi_status: 'idle',
    secret_code: null,
    is_code_verified: false,
    code_verified_at: null,
    actual_start_at: null,
    actual_end_at: null,
  }).eq('id', order_id).eq('status','expired');

  if(error) return Response.json({success:false, error:error.message},{status:500});
  return Response.json({success:true});
}

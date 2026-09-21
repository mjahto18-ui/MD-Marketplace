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
  const rawCode = searchParams.get('code');
  if(!rawCode) return new Response(JSON.stringify({order:null}), {status:400, headers:{'Content-Type':'application/json'}});
  
  const code = decodeURIComponent(rawCode).trim();
  const supabase = getSupabase();

  // 1- جرب order_code (هو اللي بتبعتو واتساب)
  let { data: order } = await supabase.from('taxi_orders').select('*').eq('order_code', code).maybeSingle();
  
  // 2- اذا ما لقى جرب secret_code
  if(!order){
    const { data } = await supabase.from('taxi_orders').select('*').eq('secret_code', code).maybeSingle();
    order = data;
  }

  // 3- اذا بعدو ما لقى جرب id
  if(!order && code.length > 20){
    try {
      const { data } = await supabase.from('taxi_orders').select('*').eq('id', code).maybeSingle();
      order = data;
    } catch {}
  }

  return new Response(JSON.stringify({order: order || null}), {
    headers:{'Content-Type':'application/json', 'Cache-Control':'no-store'}
  });
}

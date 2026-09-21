export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
function getSupabase(){ const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; return createClient(url,key); }

export async function GET(req){
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if(!code) return new Response(JSON.stringify({order:null}), {status:400});
  const supabase = getSupabase();
  const { data } = await supabase.from('taxi_orders').select('*').or(`order_code.eq.${code},secret_code.eq.${code},id.eq.${code}`).maybeSingle();
  return new Response(JSON.stringify({order: data || null}), {headers:{'Cache-Control':'no-store'}});
}

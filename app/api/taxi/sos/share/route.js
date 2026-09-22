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
  if(!rawCode) return new Response(JSON.stringify({sos:null}), {status:400, headers:{'Content-Type':'application/json'}});
  
  const code = decodeURIComponent(rawCode).trim();
  const supabase = getSupabase();

  // نفس حمايتك - لازم يكون فيه /
  if(!code.includes('/')){
    return new Response(JSON.stringify({sos:null, error:'invalid share link'}), {
      headers:{'Content-Type':'application/json', 'Cache-Control':'no-store'},
      status: 403
    });
  }

  const [orderCode, idToken] = code.split('/').map(s=>s.trim());
  
  let { data: sos } = await supabase.from('taxi_sos')
    .select('*')
    .eq('order_code', orderCode)
    .eq('id', idToken)
    .maybeSingle();

  if(!sos){
    return new Response(JSON.stringify({sos:null}), {
      headers:{'Content-Type':'application/json', 'Cache-Control':'no-store'},
      status: 404
    });
  }

  // اذا انحلت القضية
  if(sos.status === 'closed'){
    return new Response(JSON.stringify({ sos, ended: true }), {
      headers:{'Content-Type':'application/json', 'Cache-Control':'no-store'}
    });
  }

  return new Response(JSON.stringify({sos, ended: false}), {
    headers:{'Content-Type':'application/json', 'Cache-Control':'no-store'}
  });
}

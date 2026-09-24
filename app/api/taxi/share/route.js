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

  // لازم يكون شكل MD-000022/cd50412a-d0ff-... 
  // اذا حدا بعت MD-000022 لحالو او 4336 لحالو منبلوكو - هي الثغرة
  if(!code.includes('/')){
    return new Response(JSON.stringify({order:null, error:'invalid share link - use order_code/id'}), {
      headers:{'Content-Type':'application/json', 'Cache-Control':'no-store'},
      status: 403
    });
  }

  const [orderCode, idToken] = code.split('/').map(s=>s.trim());
  
  if(!orderCode || !idToken){
    return new Response(JSON.stringify({order:null}), {
      headers:{'Content-Type':'application/json', 'Cache-Control':'no-store'},
      status: 400
    });
  }

  // لازم الاتنين يطابقو نفس الرحلة - MD-000022 + id = cd50412a-d0ff-...
  let { data: order } = await supabase.from('taxi_orders')
    .select('*')
    .eq('order_code', orderCode)
    .eq('id', idToken)
    .maybeSingle();

  if(!order){
    return new Response(JSON.stringify({order:null}), {
      headers:{'Content-Type':'application/json', 'Cache-Control':'no-store'},
      status: 404
    });
  }

  // اذا انتهت الرحلة - منرجعها بس مع علامة انتهت
  if(order.status === 'completed' || order.status === 'cancelled'){
    return new Response(JSON.stringify({
      order, 
      ended: true,
      message: order.status === 'completed' ? 'انتهت الرحلة' : 'الرحلة ملغاة'
    }), {
      headers:{'Content-Type':'application/json', 'Cache-Control':'no-store'}
    });
  }

  return new Response(JSON.stringify({order, ended: false}), {
    headers:{'Content-Type':'application/json', 'Cache-Control':'no-store'}
  });
}

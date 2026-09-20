import { createClient } from "@supabase/supabase-js"
export const dynamic = "force-dynamic"
function getSupabase(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(url, key)
}
export async function GET(req, { params }){
  const supabase = getSupabase()
  const { data } = await supabase.from('taxi_live_tracking')
   .select('*')
   .eq('order_id', params.order_id)
   .order('created_at', {ascending: false})
   .limit(1)
  return Response.json(data?.[0] || null)
}

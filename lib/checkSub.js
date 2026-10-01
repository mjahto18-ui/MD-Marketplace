export async function canAccess(supabase, store_id, feature){
  const { data } = await supabase.from('stores')
   .select('subscription_enabled, subscription_end')
   .eq('"Store ID"', store_id).single()

  if(!data?.subscription_enabled){
    if(feature === 'barcode') return {ok:true}
    return {ok:false, msg:'هذه الميزة تريد اشتراك مفعل'}
  }

  if(data.subscription_end && new Date(data.subscription_end) < new Date()){
    if(feature === 'barcode') return {ok:true}
    return {ok:false, msg:`انتهى اشتراكك بتاريخ ${data.subscription_end}`}
  }
  return {ok:true}
}

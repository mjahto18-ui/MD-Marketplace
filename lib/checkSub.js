export async function canAccess(supabase, store_id, feature){
  try{
    if(!store_id) return {ok:true}

    const { data, error } = await supabase.from('stores')
      .select('subscription_enabled, subscription_end')
      .eq('Store ID', store_id)
      .maybeSingle() // maybeSingle أفضل من single مشان ما يرمي ايرور

    if(error || !data){
      console.log('canAccess no store', store_id, error?.message)
      return {ok:true}
    }

    if(data.subscription_enabled !== true){
      return {ok:true}
    }

    // البصمة بتضل شغالة عطول
    if(feature === 'barcode') return {ok:true}

    if(!data.subscription_end){
      return {ok:false, msg:`⛔ انتهى اشتراكك - ${feature} مقفول - بصمة الموظفين شغالة بالخلفية`}
    }

    // هون التعديل - لآخر النهار 23:59:59
    const end = new Date(data.subscription_end);
    end.setHours(23,59,59,999);
    
    if(end < new Date()){
      return {ok:false, msg:`⛔ انتهى اشتراكك بتاريخ ${data.subscription_end} - هذه الميزة لا تؤثر على بصمة الموظفين`}
    }

    return {ok:true}

  }catch(e){
    console.log('canAccess catch', e.message)
    return {ok:true}
  }
}

export async function canAccess(supabase, store_id, feature){
  try{
    // 1- اذا ما في store_id (Admin) -> خليه يمرق
    if(!store_id) return {ok:true}

    // 2- جيب بيانات الاشتراك - انتبه للـ Store ID بدون " زيادة
    const { data, error } = await supabase.from('stores')
      .select('subscription_enabled, subscription_end')
      .eq('Store ID', store_id)
      .single()

    if(error || !data){
      console.log('canAccess no store', store_id, error?.message)
      return {ok:true} // ما لقيناه - خليه يمرق مشان ما نكسر
    }

    // 3- اذا NULL او FALSE -> ما في نظام اشتراك -> خليه يمرق
    // هون كان الغلط عندك
    if(data.subscription_enabled !== true){
      return {ok:true}
    }

    // 4- الباركود دايما شغال حتى لو منتهي
    if(feature === 'barcode') return {ok:true}

    // 5- اذا TRUE بس ما في تاريخ -> منتهي
    if(!data.subscription_end){
      return {ok:false, msg:`⛔ انتهى اشتراكك - ${feature} مقفول - بصمة الموظفين شغالة بالخلفية`}
    }

    // 6- اذا التاريخ رايح -> منتهي
    if(new Date(data.subscription_end) < new Date()){
      return {ok:false, msg:`⛔ انتهى اشتراكك بتاريخ ${data.subscription_end} - هذه الميزة لا تؤثر على بصمة الموظفين والدوام`}
    }

    // 7- شغال
    return {ok:true}

  }catch(e){
    console.log('canAccess catch', e.message)
    return {ok:true}
  }
}

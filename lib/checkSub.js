export async function canAccess(supabase, store_id, feature, isAdmin = false){
  try{
    // ادمن بيمرق عطول
    if(isAdmin) return {ok:true}
    if(!store_id) return {ok:true}

    const { data, error } = await supabase.from('stores')
      .select('subscription_enabled, subscription_end')
      .eq('Store ID', store_id)
      .maybeSingle()

    if(error || !data){
      console.log('canAccess no store', store_id, error?.message)
      // اذا ما لقا المتجر، ما يسكر البصمة
      if(feature === 'barcode') return {ok:true}
      return {ok:false, msg:'🔒 هالخدمة بدها باقة اشتراك تتفعل', code:'NEED_SUB'}
    }

    // البصمة بتضل شغالة عطول - حتى لو ما في اشتراك
    if(feature === 'barcode') return {ok:true}

    const enabled = data.subscription_enabled === true
    const endStr = data.subscription_end

    // 1 - ما في اشتراك او ما في تاريخ = بدها باقة
    if(!enabled || !endStr){
      return {ok:false, msg:`🔒 هالخدمة بدها باقة اشتراك تتفعل - ${feature} ميزة مدفوعة`, code:'NEED_SUB'}
    }

    // 2 - في تاريخ - لآخر النهار 23:59:59
    const end = new Date(endStr);
    end.setHours(23,59,59,999);
    
    if(end < new Date()){
      return {ok:false, msg:`⛔ انتهت الخدمة ولازم تتجدد - انتهت بتاريخ ${endStr} - بصمة الموظفين شغالة بالخلفية`, code:'EXPIRED'}
    }

    // 3 - شغال
    return {ok:true}

  }catch(e){
    console.log('canAccess catch', e.message)
    if(feature === 'barcode') return {ok:true}
    return {ok:true} // بالـ catch منرجع true مشان ما نكسر السيستم لو صار ايرور غير متوقع
  }
}

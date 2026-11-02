import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
export const dynamic = "force-dynamic"

function getSupabase(){
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if(!url || !key) throw new Error("SUPABASE keys missing")
  return createClient(url, key)
}

export async function POST(req){
  const supabase = getSupabase()
  const { employee_id, store_id, action } = await req.json() // action = 'activate' | 'deactivate'

  if(!employee_id || !store_id || !action) 
    return NextResponse.json({success:false, message:'ناقص بيانات'}, {status:400})

  if(action === 'deactivate'){
    // ايقاف دغري - مسموح دائما
    const { error } = await supabase.from('employees').update({is_active:false}).eq('id', employee_id)
    if(error) return NextResponse.json({success:false, message:error.message}, {status:500})
    return NextResponse.json({success:true})
  }

  if(action === 'activate'){
    // 1. شوف قديش الحد المسموح من جدول stores
    const { data: store } = await supabase.from('stores').select('max_employees').eq('Store ID', store_id).single()
    const limit = store?.max_employees ?? 3

    // 2. عد الفعالين الحاليين بس
    const { count } = await supabase.from('employees').select('id', {count:'exact', head:true}).eq('store_id', store_id).eq('is_active', true)

    if(count >= limit){
      return NextResponse.json({success:false, message:`لا يمكنك التفعيل - لديك ${count}/${limit} فعال. يرجى الالتزام بالعدد المسموح`}, {status:403})
    }

    // 3. فعل
    const { error } = await supabase.from('employees').update({is_active:true}).eq('id', employee_id)
    if(error) return NextResponse.json({success:false, message:error.message}, {status:500})
    return NextResponse.json({success:true})
  }
}

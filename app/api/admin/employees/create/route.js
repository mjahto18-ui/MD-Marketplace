import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
export const dynamic = "force-dynamic"

function getSupabase(){
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY 
           || process.env.SUPABASE_SERVICE_KEY 
           || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url) throw new Error("SUPABASE_URL missing in env")
  if (!key) throw new Error("supabaseKey is required - add SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY")
  
  return createClient(url, key)
}

export async function POST(req){
  const supabase = getSupabase()
  const { full_name, department, salary_type, base_salary, hourly_rate, required_hours, mobile, store_id } = await req.json()

  if(!store_id || !full_name || !department) 
    return NextResponse.json({success:false, message:'ناقص بيانات'}, {status:400})

  // 1. شوف قديش الحد - صار 3
  const { data: store } = await supabase.from('stores').select('max_employees, "Store Name"').eq('Store ID', store_id).single()
  const limit = store?.max_employees ?? 3

  // 2. عد الموظفين
  const { count } = await supabase.from('employees').select('id', {count:'exact', head:true}).eq('store_id', store_id).eq('is_active', true)

  if(count >= limit){
    return NextResponse.json({success:false, message:`وصلت للحد الأقصى (${limit} موظف) - اشترك بباقة شهرية لزيادة عدد الموظفين`}, {status:403})
  }

  // 3. انشئ الموظف
  const { data, error } = await supabase.from('employees').insert({
    full_name, department, salary_type: salary_type || 'monthly',
    base_salary: base_salary || 0, hourly_rate: hourly_rate || 0,
    required_hours: required_hours || 286,
    mobile: mobile || null,
    store_id, is_active: true
  }).select().single()

  if(error) return NextResponse.json({success:false, message:error.message}, {status:500})
  return NextResponse.json({success:true, employee:data})
}

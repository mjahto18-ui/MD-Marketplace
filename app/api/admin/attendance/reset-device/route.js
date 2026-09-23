import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req){
  const { employee_id } = await req.json()
  const { error } = await supabase.from('employees').update({
    device_type: null,
    device_fingerprint: null,
    device_registered_at: null
  }).eq('id', employee_id)

  if(error) return NextResponse.json({success:false, message:error.message})
  return NextResponse.json({success:true})
}

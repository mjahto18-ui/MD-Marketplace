import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req){
  try{
    const { requestId, collected, note, paymentMethod } = await req.json()

    if(!requestId) return NextResponse.json({error:'requestId ناقص'}, {status:400})
    const amt = Number(collected)
    if(!amt) return NextResponse.json({error:'المبلغ ناقص'}, {status:400})

    const supabase = getSupabase() // هاد تبعك بياخد SERVICE_KEY لحالو
    const now = new Date()

    const { data: order } = await supabase
    .from('order_requuest')
    .select('"Pickup At"')
    .eq('Request ID', requestId)
    .single()

    let durationMin = null
    if(order?.['Pickup At']){
      durationMin = Math.ceil((now - new Date(order['Pickup At']))/60000)
    }

    const { data, error } = await supabase
    .from('order_requuest')
    .update({
        'Delivery Status': 'Delivered',
        'Delivered At': now.toISOString(),
        'Delivery Duration': durationMin,
        'Collected Amount': amt,
        'Driver Note': note || '',
        'Final Payment Method': paymentMethod || 'Cash',
        'Approval Status': 'Complete Orders'
      })
    .eq('Request ID', requestId)
    .select()

    if(error) throw error

    return NextResponse.json({success:true, data: data[0]})
  }catch(e){
    console.error(e)
    return NextResponse.json({error: e.message}, {status:500})
  }
}

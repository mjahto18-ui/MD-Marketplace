const { pendingId, donateAmount, charityId } = await req.json()

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  return NextResponse.json({ error: `ENV ناقص: url=${!!url} key=${!!key}` }, { status: 500 })
}

const supabase = createClient(url, key)

// 1- حماية: الجمعيات كلن false هلق - بس السايق مسموح
const BLOCKED_CHARITIES = ['CHARITY_CARITAS','CHARITY_RED_CROSS','CHARITY_DAR_AYTAM','CHARITY_CIVIL_DEF','CHARITY_KAFA']
if (charityId && BLOCKED_CHARITIES.includes(charityId)) {
  return NextResponse.json({ error: 'هالجمعية لسا ما وافقت - بانتظار الموافقة' }, { status: 400 })
}

// 2- اذا اختار السايق - جيب السايق من الطلب
let driverUserId = null
if (charityId === 'DRIVER_TIP') {
  const { data: pending } = await supabase.from('pending_overpay').select('"Request ID"').eq('Pending ID', pendingId).single()
  const requestId = pending?.['Request ID']
  if (requestId) {
    const { data: order } = await supabase.from('order_requuest').select('"Assigned Driver"').eq('Request ID', requestId).single()
    driverUserId = order?.['Assigned Driver'] || null
  }
  if (!driverUserId) {
    return NextResponse.json({ error: 'ما لقينا السايق تبع هالطلب' }, { status: 400 })
  }
}

const { data, error } = await supabase.rpc('process_overpay_choice', {
  p_pending_id: pendingId,
  p_donate_amount: Number(donateAmount),
  p_charity_customer_id: charityId === 'DRIVER_TIP' ? null : (charityId || null),
  p_driver_user_id: driverUserId
})

    if (error) {
      console.error('RPC ERROR:', error)
      return NextResponse.json({ error: error.message, hint: error.hint, details: error.details }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('CATCH:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

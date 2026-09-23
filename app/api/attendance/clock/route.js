export async function POST(req){
  try{
    let { employee_id, device_fingerprint, device_type, qr_token } = await req.json()
    if(!qr_token ||!device_fingerprint)
      return NextResponse.json({success:false, message:'ناقص بيانات'})

    // هون فك التشفير مرتين مشان الـ double encode
    try{ qr_token = decodeURIComponent(decodeURIComponent(qr_token)) }catch{}
    try{ qr_token = decodeURIComponent(qr_token) }catch{}

    let tokenToCheck = qr_token
    if(qr_token.includes('::')){
      const parts = qr_token.split('::')
      tokenToCheck = parts[0]
      employee_id = parts[1]
    }

    if(!employee_id) return NextResponse.json({success:false, message:'ما في ID موظف - صوّر الـ QR من جديد'})

    const supabase = getSupabase()
    const { data: qrRow } = await supabase.from('office_qr_tokens')
    .select('*').eq('token', tokenToCheck).gt('expires_at', new Date().toISOString()).single()

    if(!qrRow) return NextResponse.json({success:false, message:'الـ QR منتهي - حدث الصفحة بالمكتب'})

    const { data: emp } = await supabase.from('employees').select('id, device_fingerprint').eq('id', employee_id).single()
    if(!emp) return NextResponse.json({success:false, message:'موظف مش موجود'})

    if(!emp.device_fingerprint){
      await supabase.from('employees').update({
        device_fingerprint,
        device_type, // هون هلق رح يجي بصمة الايفون 11 الحقيقية
        device_registered_at: new Date().toISOString()
      }).eq('id', employee_id)
    } else {
      if(emp.device_fingerprint!== device_fingerprint){
        return NextResponse.json({success:false, message:'هيدا مش تلفونك المسجل!'})
      }
    }
    //... باقي الـ clock_in/out نفسو

"use client"
import { useState, useEffect } from "react"

export default function TaxiCustomerPage() {
  const [step, setStep] = useState('form')
  const [vehicleType, setVehicleType] = useState('car')
  const [tripType, setTripType] = useState('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [origin, setOrigin] = useState({ name: '', lat: null, lng: null })
  const [dest, setDest] = useState({ name: '', lat: null, lng: null })
  const [pricing, setPricing] = useState(null)
  const [draftId, setDraftId] = useState(null)
  const [order, setOrder] = useState(null)
  const [secretCode, setSecretCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [emergencyNote, setEmergencyNote] = useState('')
  const [showEmergency, setShowEmergency] = useState(false)
  const [customer, setCustomer] = useState(null)
  const [meLoading, setMeLoading] = useState(true)

  // نفس السيزن تبعك - session cookie -> /api/me
  useEffect(() => {
    fetch('/api/me')
      .then(r => {
        if (!r.ok) throw new Error('not logged')
        return r.json()
      })
      .then(data => {
        if (data.user) {
          setCustomer(data.user)
          // خذ احداثيات الزبون المسجلة من جدول customers
          if (data.user.lat && data.user.lng) {
            setOrigin({
              name: data.user.address || data.user.area || '',
              lat: parseFloat(data.user.lat),
              lng: parseFloat(data.user.lng)
            })
          }
        }
      })
      .catch(() => {
        window.location.href = '/login'
      })
      .finally(() => setMeLoading(false))
  }, [])

  const vehicleOptions = [
    { id: 'car', label: 'سيارة', icon: '🚕', seats: 4 },
    { id: 'van', label: 'فان', icon: '🚐', seats: 7 },
    { id: 'moto', label: 'موتو', icon: '🏍️', seats: 1 },
    { id: 'toktok', label: 'توكتوك', icon: '🛺', seats: 3 },
    { id: 'touristic_van', label: 'فان سياحي', icon: '🚌', seats: 11 },
  ]

  const calcApprox = async () => {
    if (!origin.lat || !dest.name) {
      alert('حدد نقطة الانطلاق والوجهة')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/taxi/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer.customerId || customer.phone,
          customer_name: customer.name,
          customer_phone: customer.phone,
          origin_name: origin.name || customer.address || 'نقطة الانطلاق',
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          dest_name: dest.name,
          dest_lat: dest.lat || origin.lat, // مؤقت لحد ما تربط خرائط
          dest_lng: dest.lng || origin.lng,
          vehicle_type: vehicleType,
          cityKm: 5,
          highwayKm: 2,
          totalKm: 7,
          scheduled_at: tripType === 'scheduled' ? scheduledAt : null
        })
      }).then(r => r.json())
      if (res.success) {
        setPricing(res.pricing)
        setDraftId(res.draft.id)
      } else {
        alert(res.error)
      }
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const res = await fetch('/api/taxi/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_id: draftId, origin_lat: origin.lat, origin_lng: origin.lng, vehicle_type: vehicleType })
    }).then(r => r.json())
    if (res.success) {
      setOrder(res.order)
      setStep('searching')
      // Polling لحد ما سايق يقبل - مثل ما عامل بالدلفري
      const interval = setInterval(async () => {
        const check = await fetch(`/api/taxi/order?id=${res.order.id}`).then(r => r.json()).catch(()=>null)
        if (check?.order?.status === 'accepted' || check?.order?.secret_code) {
          clearInterval(interval)
          setSecretCode(check.order.secret_code)
          setOrder(check.order)
          setStep('accepted')
        }
      }, 3000)
      // Demo fallback بعد 5 ثواني
      setTimeout(() => {
        setStep('accepted')
        setSecretCode('4829')
      }, 5000)
    } else {
      alert(res.error)
    }
    setLoading(false)
  }

  if (meLoading) return <div style={{ padding: 20, textAlign: 'center', fontFamily: 'Cairo' }}>عم يحمل السيزن...</div>
  if (!customer) return null

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ background: '#0a1930', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 20 }}>
        <b>🚕 طلب تاكسي</b>
        <div style={{ fontSize: 11, opacity: 0.8, textAlign: 'left' }}>{customer.name}<br/>{customer.phone}</div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: 12 }}>
        {/* معلومات السيزن - بتاخد من users + customers مثل /api/me */}
        <div style={{ background: '#eef2ff', borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 12, lineHeight: 1.6 }}>
          📍 عنوانك: {customer.address || customer.area || '-'}<br/>
          🗺️ احداثياتك: {customer.lat ? `${customer.lat}, ${customer.lng}` : 'غير مسجلة - حدد على الخريطة'}<br/>
          🎁 توصيل مجاني: {customer.freeDeliveries || 0}
        </div>

        {step === 'form' && (
          <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setTripType('now')} style={{ flex: 1, padding: 12, borderRadius: 12, fontWeight: 900, border: '2px solid', borderColor: tripType === 'now' ? '#FFC107' : '#e5e7eb', background: tripType === 'now' ? '#FFC107' : 'white' }}>⚡ طلب فوري</button>
              <button onClick={() => setTripType('scheduled')} style={{ flex: 1, padding: 12, borderRadius: 12, fontWeight: 900, border: '2px solid', borderColor: tripType === 'scheduled' ? '#FFC107' : '#e5e7eb', background: tripType === 'scheduled' ? '#FFC107' : 'white' }}>🕒 حجز مسبق</button>
            </div>

            {tripType === 'scheduled' && (
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', marginBottom: 12 }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, opacity: 0.5 }}>من وين - ياخد تلقائيا من عنوانك المسجل</label>
                <input value={origin.name} onChange={e => setOrigin({ ...origin, name: e.target.value })} placeholder={customer.address || "حدد نقطة الانطلاق"} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, opacity: 0.5 }}>لوين</label>
                <input value={dest.name} onChange={e => setDest({ ...dest, name: e.target.value })} placeholder="حدد الوجهة" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', marginTop: 4 }} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 900, opacity: 0.5 }}>نوع المركبة</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                {vehicleOptions.map(v => (
                  <button key={v.id} onClick={() => setVehicleType(v.id)} style={{ padding: 12, borderRadius: 12, border: '2px solid', borderColor: vehicleType === v.id ? '#0a1930' : '#e5e7eb', background: vehicleType === v.id ? '#0a1930' : 'white', color: vehicleType === v.id ? 'white' : 'black', fontWeight: 900, textAlign: 'right' }}>
                    <span style={{ fontSize: 20 }}>{v.icon}</span> {v.label} <span style={{ fontSize: 10, opacity: 0.6 }}>({v.seats})</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={calcApprox} disabled={loading} style={{ width: '100%', background: '#111', color: 'white', padding: 14, borderRadius: 12, fontWeight: 900 }}>
              {loading ? 'جاري الحساب...' : 'احسب السعر التقريبي'}
            </button>

            {pricing && (
              <div style={{ marginTop: 16, background: '#FFC107', borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>السعر التقريبي (أعلى قيمة 1500cc) - السعر النهائي أرخص</div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{pricing.customer_pays_lbp?.toLocaleString()} ل.ل</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>قاعدة: {pricing.breakdown?.base} + وقود {pricing.breakdown?.fuel_per_km} / كم</div>
                <button onClick={handleConfirm} disabled={loading} style={{ marginTop: 12, width: '100%', background: '#0a1930', color: 'white', padding: 14, borderRadius: 10, fontWeight: 900 }}>تأكيد الطلب - دور على سايق ضمن 5 كم</button>
              </div>
            )}
          </div>
        )}

        {step === 'searching' && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>🔍</div>
            <h3 style={{ fontWeight: 900, marginTop: 8 }}>عم ندور على سايق قريب...</h3>
            <p style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>ضمن 5 كيلو دائري - {vehicleType} - {customer.area}</p>
            <div style={{ marginTop: 16, background: '#f3f4f6', borderRadius: 12, padding: 12, fontSize: 12 }}>
              الطلب: {origin.name} → {dest.name}<br />
              السعر التقريبي: {pricing?.customer_pays_lbp?.toLocaleString()} ل.ل
            </div>
          </div>
        )}

        {step === 'accepted' && (
          <div style={{ background: 'white', borderRadius: 16, padding: 16 }}>
            <div style={{ background: '#dcfce7', padding: 12, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontWeight: 900, color: '#16a34a' }}>✅ تم قبول طلبك</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{order?.taxi_name || 'السائق أحمد'} في الطريق اليك</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>🚕 {order?.taxi_car_type || 'TOYOTA'} - {order?.taxi_plate_number || '123456'} - على بعد 1.2 كم</div>
            </div>

            <div style={{ marginTop: 16, background: '#0a1930', color: 'white', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 11, opacity: 0.7 }}>كود الرحلة - أعطيه للسائق</div>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 8, marginTop: 8 }}>{secretCode}</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>السائق عنده فقسة تأكيد الرحلة + لوحة أرقام</div>
            </div>

            <div style={{ height: 200, background: '#e5e7eb', borderRadius: 12, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
              🗺️ خريطة تتبع حي - taxi_lat_live / taxi_lng_live<br/>{order?.id}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <a href={`tel:${order?.taxi_phone || '70000000'}`} style={{ flex: 1, background: '#111', color: 'white', padding: 12, borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontWeight: 900 }}>📞 اتصال</a>
              <a href={`https://wa.me/${order?.taxi_phone || '96170000000'}`} target="_blank" style={{ flex: 1, background: '#25D366', color: 'white', padding: 12, borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontWeight: 900 }}>واتساب</a>
              <button onClick={() => setShowEmergency(true)} style={{ flex: 1, background: '#ef4444', color: 'white', padding: 12, borderRadius: 10, fontWeight: 900 }}>🚨 طوارئ</button>
            </div>
          </div>
        )}

        {showEmergency && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: 16, width: '100%', maxWidth: 360 }}>
              <h3 style={{ fontWeight: 900 }}>🚨 طوارئ - {customer.name}</h3>
              <div style={{ fontSize: 10, background: '#f3f4f6', padding: 6, borderRadius: 6, marginTop: 6 }}>سيتم ارسال: {customer.phone} + {customer.lat},{customer.lng} + الطلب {order?.id}</div>
              <textarea value={emergencyNote} onChange={e => setEmergencyNote(e.target.value)} placeholder="شو صار؟" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', minHeight: 80, marginTop: 8 }} />
              <button onClick={async () => {
                await fetch('/api/taxi/emergency', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: order?.id, customer_id: customer.customerId, lat: customer.lat, lng: customer.lng, note: emergencyNote }) })
                alert('تم ارسال بلاغ طوارئ مع موقعك'); setShowEmergency(false)
              }} style={{ marginTop: 12, width: '100%', background: '#ef4444', color: 'white', padding: 12, borderRadius: 10, fontWeight: 900 }}>ارسال طوارئ + موقعي</button>
              <button onClick={() => setShowEmergency(false)} style={{ marginTop: 8, width: '100%', background: '#eee', padding: 10, borderRadius: 10 }}>إلغاء</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

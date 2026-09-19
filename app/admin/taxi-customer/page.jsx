"use client"
import { useState, useEffect } from "react"

export default function TaxiCustomerPage() {
  const [step, setStep] = useState('form') // form, searching, accepted, tracking, completed
  const [vehicleType, setVehicleType] = useState('car')
  const [tripType, setTripType] = useState('now') // now, scheduled
  const [scheduledAt, setScheduledAt] = useState('')
  const [origin, setOrigin] = useState({ name: '', lat: 33.8938, lng: 35.5018 })
  const [dest, setDest] = useState({ name: '', lat: 33.8938, lng: 35.5018 })
  const [pricing, setPricing] = useState(null)
  const [draftId, setDraftId] = useState(null)
  const [order, setOrder] = useState(null)
  const [secretCode, setSecretCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [emergencyNote, setEmergencyNote] = useState('')
  const [showEmergency, setShowEmergency] = useState(false)

  const vehicleOptions = [
    { id: 'car', label: 'سيارة', icon: '🚕', seats: 4 },
    { id: 'van', label: 'فان', icon: '🚐', seats: 7 },
    { id: 'moto', label: 'موتو', icon: '🏍️', seats: 1 },
    { id: 'toktok', label: 'توكتوك', icon: '🛺', seats: 3 },
    { id: 'touristic_van', label: 'فان سياحي', icon: '🚌', seats: 11 },
  ]

  const calcApprox = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/taxi/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'زبونة تجريبية',
          customer_phone: '96170000000',
          origin_name: origin.name || 'نقطة الانطلاق',
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          dest_name: dest.name || 'الوجهة',
          dest_lat: dest.lat,
          dest_lng: dest.lng,
          vehicle_type: vehicleType,
          cityKm: 5,
          highwayKm: 2,
          totalKm: 7
        })
      }).then(r => r.json())
      if (res.success) {
        setPricing(res.pricing)
        setDraftId(res.draft.id)
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
      // Simulate accept after 5s for demo
      setTimeout(() => {
        setStep('accepted')
        setSecretCode('4829')
      }, 5000)
    }
    setLoading(false)
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Cairo, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0a1930', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 20 }}>
        <b>🚕 طلب تاكسي</b>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{step}</div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: 12 }}>
        {step === 'form' && (
          <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            {/* Trip Type */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setTripType('now')} style={{ flex: 1, padding: 12, borderRadius: 12, fontWeight: 900, border: '2px solid', borderColor: tripType === 'now' ? '#FFC107' : '#e5e7eb', background: tripType === 'now' ? '#FFC107' : 'white' }}>⚡ طلب فوري</button>
              <button onClick={() => setTripType('scheduled')} style={{ flex: 1, padding: 12, borderRadius: 12, fontWeight: 900, border: '2px solid', borderColor: tripType === 'scheduled' ? '#FFC107' : '#e5e7eb', background: tripType === 'scheduled' ? '#FFC107' : 'white' }}>🕒 حجز مسبق</button>
            </div>

            {tripType === 'scheduled' && (
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', marginBottom: 12 }} />
            )}

            {/* Origin / Dest */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, opacity: 0.5 }}>من وين</label>
                <input value={origin.name} onChange={e => setOrigin({ ...origin, name: e.target.value })} placeholder="حدد نقطة الانطلاق" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, opacity: 0.5 }}>لوين</label>
                <input value={dest.name} onChange={e => setDest({ ...dest, name: e.target.value })} placeholder="حدد الوجهة" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', marginTop: 4 }} />
              </div>
            </div>

            {/* Vehicle Type */}
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
                <button onClick={handleConfirm} style={{ marginTop: 12, width: '100%', background: '#0a1930', color: 'white', padding: 14, borderRadius: 10, fontWeight: 900 }}>تأكيد الطلب - دور على سايق ضمن 5 كم</button>
              </div>
            )}
          </div>
        )}

        {step === 'searching' && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>🔍</div>
            <h3 style={{ fontWeight: 900, marginTop: 8 }}>عم ندور على سايق قريب...</h3>
            <p style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>ضمن 5 كيلو دائري - {vehicleType}</p>
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
              <div style={{ fontSize: 13, marginTop: 4 }}>السائق أحمد في الطريق اليك</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>🚕 TOYOTA - 123456 - على بعد 1.2 كم</div>
            </div>

            <div style={{ marginTop: 16, background: '#0a1930', color: 'white', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 11, opacity: 0.7 }}>كود الرحلة - أعطيه للسائق</div>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 8, marginTop: 8 }}>{secretCode}</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>فقسة تأكيد الرحلة + لوحة الأرقام عند السائق</div>
            </div>

            <div style={{ height: 200, background: '#e5e7eb', borderRadius: 12, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🗺️ خريطة تتبع حي - taxi_lat_live / taxi_lng_live
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <a href={`tel:70000000`} style={{ flex: 1, background: '#111', color: 'white', padding: 12, borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontWeight: 900 }}>📞 اتصال</a>
              <a href={`https://wa.me/96170000000`} target="_blank" style={{ flex: 1, background: '#25D366', color: 'white', padding: 12, borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontWeight: 900 }}>واتساب</a>
              <button onClick={() => setShowEmergency(true)} style={{ flex: 1, background: '#ef4444', color: 'white', padding: 12, borderRadius: 10, fontWeight: 900 }}>🚨 طوارئ</button>
            </div>
          </div>
        )}

        {showEmergency && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: 16, width: '100%', maxWidth: 360 }}>
              <h3 style={{ fontWeight: 900 }}>🚨 طوارئ</h3>
              <textarea value={emergencyNote} onChange={e => setEmergencyNote(e.target.value)} placeholder="شو صار؟" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', minHeight: 80, marginTop: 8 }} />
              <button onClick={() => { alert('تم ارسال بلاغ طوارئ مع موقعك'); setShowEmergency(false) }} style={{ marginTop: 12, width: '100%', background: '#ef4444', color: 'white', padding: 12, borderRadius: 10, fontWeight: 900 }}>ارسال طوارئ + موقعي</button>
              <button onClick={() => setShowEmergency(false)} style={{ marginTop: 8, width: '100%', background: '#eee', padding: 10, borderRadius: 10 }}>إلغاء</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

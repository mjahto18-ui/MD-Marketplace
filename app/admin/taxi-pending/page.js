"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import BackToDashboard from "@/components/BackToDashboard"

export default function TaxiPendingPage() {
  const [taxis, setTaxis] = useState([])
  const [areaNames, setAreaNames] = useState({})
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => { 
    fetchPending() 
  }, [])

  // 1. جلب التاكسي المعلقين - status pending صغيرة
  const fetchPending = async () => {
    const { data: pending } = await supabase
      .from('taxi_drivers')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    setTaxis(pending || [])

    const { data: areas } = await supabase.from('areas').select('*')
    const aMap = {}
    areas?.forEach(a => aMap[a['Area ID'] || a['ID']] = a['Area Name'])
    setAreaNames(aMap)
  }

  // 2. واتساب للتاكسي - صار ياخد PIN
  const getWhatsAppLink = (taxi, pin) => {
    let mobile = (taxi['phone'] || '').toString()
    if (!mobile) return null
    mobile = mobile.replace(/\D/g, '')
    if (!mobile) return null
    mobile = mobile.replace(/^0+/, '').replace(/^961/, '')
    if (mobile.length < 6) return null

    const name = taxi['full_name'] || ''
    const car = taxi['vehicle_type'] || ''
    const plate = taxi['plate_number'] || ''
    
    const message = `مرحبًا يا ${name} 👋
تم تفعيل حسابك بنجاح! 🚕

السيارة: ${car} - ${plate}

تستطيع الدخول الى التطبيق:
https://md-marketplace.store/admin/login

📱 رقم الهاتف: ${taxi['phone']}
🔑 رمز الخول الخاص بك: ${pin}

احفظ رمز الدخول ، سوف تحتاجه للدخول!

بالتوفيق!`
    
    return `https://wa.me/961${mobile}?text=${encodeURIComponent(message)}`
  }

  // 3. القبول والرفض
  const handleAction = async (taxi, newStatus) => {
    const actionText = newStatus === 'active' ? 'قبول السائق' : 'رفض السائق'
    const confirmed = confirm(`${actionText} - ${taxi['full_name']} (${taxi['phone']}) ؟`)
    if(!confirmed) return

    const { data, error } = await supabase
      .from('taxi_drivers')
      .update({ 'status': newStatus })
      .eq('Taxi_ID', taxi['Taxi_ID'])
      .select()

    if(error){ alert("Error: " + error.message); return }

    if(newStatus === 'active'){
      await new Promise(r => setTimeout(r, 1200));

      // جلب الـ PIN من جدول users
      const cleanPhone = (taxi['phone'] || '').toString().replace(/\D/g, '');
      const { data: newUser } = await supabase
        .from('users')
        .select('"PIN"')
        .or(`Mobile.eq.${taxi['phone']},Mobile.eq.${cleanPhone}`)
        .order('_supa_synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const pin = newUser?.PIN || taxi['pin'] || taxi['PIN'] || 'تواصل مع الادارة لمعرفة كلمة السر';

      const waLink = getWhatsAppLink(taxi, pin)
      if(waLink) window.open(waLink, '_blank')
      else alert(`تم قبول ${taxi['full_name']} بنجاح، بس ما في رقم واتساب صحيح - PIN هو ${pin}`)
    }

    setTaxis(prev => prev.filter(t => t['Taxi_ID'] !== taxi['Taxi_ID']))
  }

  return (
    <div className="p-6">
     <BackToDashboard />
      <h1 className="text-2xl font-bold mb-6">Taxi Pending - {taxis.length}</h1>
      <div className="grid gap-4">
        {taxis.map(t => {
          const areaName = areaNames[t['area']] || t['area'] || '-'
          return (
            <div key={t['Taxi_ID']} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
              <div>
                <div className="font-bold">{t['full_name']} <span className="text-sm font-normal text-gray-500">📞 {t['phone']} - {t['vehicle_type']} {t['engine_cc']} - {t['car_color']}</span></div>
                <div className="text-sm text-gray-600">{t['plate_number']} - {t['car_type']} - مقاعد: {t['seats']} - {areaName} - {t['gender']}</div>
                <div className="text-xs mt-1 text-gray-400">
                 {t['address'] || ''} | Lat: {t['Current Latitude'] || t['lat']} , Lng: {t['Current Longitude'] || t['lng']} | Comm: {t['commission_percentage']}% | Rating: {t['average_rating']} {t['rating_level']}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(t, 'active')} className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 font-bold">✅ قبول</button>
                <button onClick={() => handleAction(t, 'suspended')} className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 font-bold">❌ رفض</button>
              </div>
            </div>
          )
        })}
        {taxis.length === 0 && <p className="text-gray-500">ما في تاكسي معلقين 👌</p>}
      </div>
    </div>
  )
}

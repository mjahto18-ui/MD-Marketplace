"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import BackToDashboard from "@/components/BackToDashboard"

export default function DriversPendingPage() {
  const [drivers, setDrivers] = useState([])
  const [areaNames, setAreaNames] = useState({})
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => { 
    fetchPending() 
  }, [])

  // 1. جلب السائقين المعلقين - Status Inactive كبيرة
  const fetchPending = async () => {
    const { data: pending } = await supabase
      .from('drivers')
      .select('*')
      .eq('Status', 'Inactive')
      .order('_supa_synced_at', { ascending: false })

    setDrivers(pending || [])

    const { data: areas } = await supabase.from('areas').select('*')
    const aMap = {}
    areas?.forEach(a => aMap[a['Area ID'] || a['ID']] = a['Area Name'])
    setAreaNames(aMap)
  }

  // 2. نفس تابع الواتساب - بس رسالة للدرايفر - صار ياخد PIN
  const getWhatsAppLink = (driver, pin) => {
    let mobile = (driver['Mobile'] || '').toString()
    if (!mobile) return null
    mobile = mobile.replace(/\D/g, '')
    if (!mobile) return null
    mobile = mobile.replace(/^0+/, '').replace(/^961/, '')
    if (mobile.length < 6) return null

    const name = driver['Driver Name'] || ''
    
    const message = `مرحبًا يا ${name} 👋
تم تفعيل حسابك بنجاح! 🛵

تقدر تفوت هلق على التطبيق:
https://md-marketplace.store/admin/login

📱 رقم الموبايل: ${driver['Mobile']}
🔑 كلمة السر الخاصة بك: ${pin}

احفظ كلمة السر، سوف تحتاجها للدخول!

بالتوفيق!`
    
    return `https://wa.me/961${mobile}?text=${encodeURIComponent(message)}`
  }

  // 3. القبول والرفض - نفس منطق الكوستمر
  const handleAction = async (driver, newStatus) => {
    const actionText = newStatus === 'Active' ? 'قبول السائق' : 'رفض السائق'
    const confirmed = confirm(`${actionText} - ${driver['Driver Name']} (${driver['Driver ID']}) ؟`)
    if(!confirmed) return

    const { data, error } = await supabase
      .from('drivers')
      .update({ 'Status': newStatus })
      .eq('Driver ID', driver['Driver ID'])
      .select()

    if(error){ alert("Error: " + error.message); return }
    if(!data || data.length===0){
      await supabase.from('drivers').update({ 'Status': newStatus }).eq('supa_id', driver['supa_id'])
    }

    if(newStatus === 'Active'){
      await new Promise(r => setTimeout(r, 1200));

      // جلب الـ PIN من جدول users - التريغر تبع الدرايفر بيخلقو
      const { data: newUser } = await supabase
        .from('users')
        .select('"PIN"')
        .eq('Mobile', driver['Mobile'])
        .order('_supa_synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const pin = newUser?.PIN || driver['PIN'] || 'تواصل مع الادارة لمعرفة كلمة السر';

      const waLink = getWhatsAppLink(driver, pin)
      if(waLink) window.open(waLink, '_blank')
      else alert(`تم قبول ${driver['Driver Name']} بنجاح، بس ما في رقم واتساب صحيح - PIN هو ${pin}`)
    }

    setDrivers(prev => prev.filter(d => d['Driver ID'] !== driver['Driver ID']))
  }

  return (
    <div className="p-6">
     <BackToDashboard />
      <h1 className="text-2xl font-bold mb-6">Drivers Pending - {drivers.length}</h1>
      <div className="grid gap-4">
        {drivers.map(d => {
          const areaName = areaNames[d['Area']] || d['Area'] || '-'
          return (
            <div key={d['Driver ID']} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
              <div>
                <div className="font-bold">#{d['Driver ID']} - {d['Driver Name']} <span className="text-sm font-normal text-gray-500">📞 {d['Mobile']} - {d['VehicleTyp']}</span></div>
                <div className="text-sm text-gray-600">{d['Email'] || ''} - {areaName}</div>
                <div className="text-xs mt-1 text-gray-400">
                 Lat: {d['Current Latitude']} , Lng: {d['Current Longitude']} | Delivered: {d['Total Delivered'] || 0} | Rating: {d['Avg Rating'] || 0} ({d['Rating Count'] || 0})
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(d, 'Active')} className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 font-bold">✅ قبول</button>
                <button onClick={() => handleAction(d, 'Inactive')} className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 font-bold">❌ رفض</button>
              </div>
            </div>
          )
        })}
        {drivers.length === 0 && <p className="text-gray-500">ما في سائقين معلقين 👌</p>}
      </div>
    </div>
  )
}

"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import BackToDashboard from "@/components/BackToDashboard"

export default function StoresPendingPage() {
  const [stores, setStores] = useState([])
  const [areaNames, setAreaNames] = useState({})
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => { 
    fetchPending() 
  }, [])

  // 1. جلب المتاجر المعلقة - inactive صغيرة
  const fetchPending = async () => {
    const { data: pending } = await supabase
      .from('stores')
      .select('*')
      .eq('Status', 'inactive')
      .neq('Store ID', 'MD_HQ_001') // استثناء الـ HQ
      .order('_supa_synced_at', { ascending: false })

    setStores(pending || [])

    const { data: areas } = await supabase.from('areas').select('*')
    const aMap = {}
    areas?.forEach(a => aMap[a['Area ID'] || a['ID']] = a['Area Name'])
    setAreaNames(aMap)
  }

  // 2. واتساب للمتجر - صار ياخد PIN
  const getWhatsAppLink = (store, pin) => {
    let mobile = (store['Mobile'] || '').toString()
    if (!mobile) return null
    mobile = mobile.replace(/\D/g, '')
    if (!mobile) return null
    mobile = mobile.replace(/^0+/, '').replace(/^961/, '')
    if (mobile.length < 6) return null

    const name = store['Store Name'] || store['Owner Name'] || ''
    
    const message = `مرحبًا يا ${name} 👋
تم تفعيل متجرك بنجاح! 🎉

تستطيع الدخول الان الى لوحة التحكم:
https://md-marketplace.store/admin/login

📱 رقم الموبايل: ${store['Mobile']}
🔑 كلمة السر الخاصة بك: ${pin}

احفظ كلمة السر، سوف تحتاجها للدخول!

بالتوفيق مع MD-Marketplace!`
    
    return `https://wa.me/961${mobile}?text=${encodeURIComponent(message)}`
  }

  // 3. القبول والرفض - نفس منطق الكوستمر
  const handleAction = async (store, newStatus) => {
    const actionText = newStatus === 'Active' ? 'قبول المتجر' : 'رفض المتجر'
    const confirmed = confirm(`${actionText} - ${store['Store Name']} (${store['Store ID']}) ؟`)
    if(!confirmed) return

    const { data, error } = await supabase
      .from('stores')
      .update({ 'Status': newStatus })
      .eq('Store ID', store['Store ID'])
      .select()

    if(error){ alert("Error: " + error.message); return }
    if(!data || data.length===0){
      await supabase.from('stores').update({ 'Status': newStatus }).eq('supa_id', store['supa_id'])
    }

    if(newStatus === 'Active'){
      // انتظار التريغر ليخلق اليوزر
      await new Promise(r => setTimeout(r, 1200));

      // جلب الـ PIN من جدول users يلي خلقو التريغر
      const { data: newUser } = await supabase
        .from('users')
        .select('"PIN"')
        .eq('Store ID', store['Store ID'])
        .order('_supa_synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const pin = newUser?.PIN || 'تواصل مع الادارة لمعرفة كلمة السر';

      const waLink = getWhatsAppLink(store, pin)
      if(waLink) window.open(waLink, '_blank')
      else alert(`تم قبول ${store['Store Name']} بنجاح، بس ما في رقم واتساب صحيح - PIN هو ${pin}`)
    }

    setStores(prev => prev.filter(s => s['Store ID'] !== store['Store ID']))
  }

  return (
    <div className="p-6">
     <BackToDashboard />
      <h1 className="text-2xl font-bold mb-6">Stores Pending - {stores.length}</h1>
      <div className="grid gap-4">
        {stores.map(s => {
          const areaName = areaNames[s['Area']] || s['Area'] || '-'
          return (
            <div key={s['Store ID']} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
              <div>
                <div className="font-bold">#{s['Store ID']} - {s['Store Name']} <span className="text-sm font-normal text-gray-500">📞 {s['Mobile']} - {s['Category']}</span></div>
                <div className="text-sm text-gray-600">{s['Owner Name']} - {s['Adress']} - {areaName}</div>
                <div className="text-xs mt-1 text-gray-400">
                 Lat: {s['Current Latitude']} , Lng: {s['Current Longitude']} | Commission: {s['Commission Rate']} | Delivery: {s['Delivery Available']} | Open: {s['Open Time']} - {s['Close Time']}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(s, 'Active')} className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 font-bold">✅ قبول</button>
                <button onClick={() => handleAction(s, 'inactive')} className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 font-bold">❌ رفض</button>
              </div>
            </div>
          )
        })}
        {stores.length === 0 && <p className="text-gray-500">ما في متاجر معلقة 👌</p>}
      </div>
    </div>
  )
}

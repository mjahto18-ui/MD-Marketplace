"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import BackToDashboard from "@/components/BackToDashboard"

export default function CustomersPendingPage() {
  const [customers, setCustomers] = useState([])
  const [areaNames, setAreaNames] = useState({})
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => { 
    fetchPending() 
  }, [])

  // 1. جلب العملاء المعلقين
  const fetchPending = async () => {
    const { data: pending } = await supabase
      .from('customers')
      .select('*')
      .eq('Status', 'Pending')
      .order('_supa_synced_at', { ascending: false })

    setCustomers(pending || [])

    const { data: areas } = await supabase.from('areas').select('*')
    const aMap = {}
    areas?.forEach(a => aMap[a['Area ID'] || a['ID']] = a['Area Name'])
    setAreaNames(aMap)
  }

  // 2. هيدا تابع انشاء رابط الواتساب - نفس معادلة اب شيت القديمة
  const getWhatsAppLink = (customer) => {
    
    // اذا ما في موبايل اصلا
    let mobile = (customer['Mobile'] || '').toString()
    if (!mobile) {
      return null
    }

    // شيل كل شي مش رقم
    mobile = mobile.replace(/\D/g, '')

    // اذا بعد التنضيف فاضي
    if (!mobile) {
      return null
    }

    // شيل الصفر الاول وشيل 961 اذا موجودة
    mobile = mobile.replace(/^0+/, '').replace(/^961/, '')

    // اذا الرقم كتير قصير يعني غلط
    if (mobile.length < 6) {
      return null
    }

    const name = customer['Name'] || ''
    const pin = customer['PIN'] || customer['New PIN'] || ''

    // نص الرسالة
    const message = `مرحبًا يا ${name} 👋
تم تفعيل حسابك بنجاح!

رمز الدخول الخاص بك: ${pin}

لديك 5 توصيلات مجانية 🎁

اضغط هنا للدخول مباشرة:
https://md-marketplace.store/

نتمنى لك تجربة ممتعة مع MD‑Marketplace.`
    
    // انشاء رابط wa.me
    const encodedMessage = encodeURIComponent(message)
    const finalLink = `https://wa.me/961${mobile}?text=${encodedMessage}`
    
    return finalLink
  }

  // 3. تابع القبول والرفض
  const handleAction = async (customer, newStatus) => {
    
    // رسالة تأكيد
    const actionText = newStatus === 'Active' ? 'قبول العميل' : 'رفض العميل'
    const confirmed = confirm(`${actionText} - ${customer['Name']} (${customer['Customer ID']}) ؟`)
    
    if(!confirmed) {
      return
    }

    // تحديث الحالة في Supabase
    const { data, error } = await supabase
      .from('customers')
      .update({
        'Status': newStatus,
        'Approved Date': new Date().toISOString(),
      })
      .eq('Customer ID', customer['Customer ID'])
      .select()

    // اذا في خطأ
    if(error){
      alert("Error: " + error.message)
      return
    } 
    
    // اذا ما لقى العميل بالـ Customer ID - جرب بـ supa_id
    if(!data || data.length===0){
      await supabase.from('customers').update({ 'Status': newStatus }).eq('supa_id', customer['supa_id'])
    }

    // 4. اذا قبول -> جرب افتح واتساب
    if(newStatus === 'Active'){
      
      const waLink = getWhatsAppLink(customer)

      // اذا في رابط صحيح
      if(waLink){
        window.open(waLink, '_blank')
      } 
      // اذا ما في رقم - لا تفشل، بس خبر
      else {
        alert(`تم قبول ${customer['Name']} بنجاح، بس ما في رقم واتساب صحيح فما فتحت الرسالة.`)
      }
    }

    // 5. شيل العميل من اللستة
    setCustomers(prev => prev.filter(c => c['Customer ID'] !== customer['Customer ID']))
  }

  return (
    <div className="p-6">
     <BackToDashboard />
      <h1 className="text-2xl font-bold mb-6">Customers Pending - {customers.length}</h1>
      <div className="grid gap-4">
        {customers.map(c => {
          const areaName = areaNames[c['Area']] || c['Area'] || '-'
          return (
            <div key={c['Customer ID']} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
              <div>
                <div className="font-bold">#{c['Customer ID']} - {c['Name']} <span className="text-sm font-normal text-gray-500">📞 {c['Mobile']}</span></div>
                <div className="text-sm text-gray-600">{c['Adress']} - {areaName}</div>
                <div className="text-xs mt-1 text-gray-400">
                  Lat: {c['Current Latitude']||c['Registration Latitude']} , Lng: {c['Current Longtitude']||c['Registration Longitude']} | PIN: {c['PIN']}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(c, 'Active')} className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 font-bold">
                  ✅ قبول
                </button>
                <button onClick={() => handleAction(c, 'Inactive')} className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 font-bold">
                  ❌ رفض
                </button>
              </div>
            </div>
          )
        })}
        {customers.length === 0 && <p className="text-gray-500">ما في عملا معلقين 👌</p>}
      </div>
    </div>
  )
}

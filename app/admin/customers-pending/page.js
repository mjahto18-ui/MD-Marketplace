"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function CustomersPendingPage() {
  const [customers, setCustomers] = useState([])
  const [areaNames, setAreaNames] = useState({})
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => { fetchPending() }, [])

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

  const handleAction = async (customer, newStatus) => {
    const actionText = newStatus === 'Active' ? 'قبول العميل' : 'رفض العميل'
    if(!confirm(`${actionText} - ${customer['Name']} (${customer['Customer ID']}) ؟`)) return

    const { data, error } = await supabase
      .from('customers')
      .update({
        'Status': newStatus,
        'Approved Date': new Date().toISOString(),
        // 'Approved By': 'admin' // اذا عندك user
      })
      .eq('Customer ID', customer['Customer ID'])
      .select()

    if(error){
      alert("Error: " + error.message)
    } else if(!data || data.length===0){
      alert("ما لقى العميل - جرب بـ supa_id")
      // fallback بـ supa_id
      await supabase.from('customers').update({ 'Status': newStatus }).eq('supa_id', customer['supa_id'])
    } else {
      setCustomers(prev => prev.filter(c => c['Customer ID'] !== customer['Customer ID']))
    }
  }

  return (
    <div className="p-6">
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

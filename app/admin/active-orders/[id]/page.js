"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [details, setDetails] = useState([])
  const [names, setNames] = useState({ customers: {}, products: {}, stores: {}, areas: {}, drivers: {}, users: {} })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    if(id) fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    const { data: orderData } = await supabase
  .from('order_requuest')
  .select('*')
  .eq('Request ID', id)
  .single()
    if(!orderData) return
    setOrder(orderData)

    const { data: detailsData } = await supabase
  .from('order_details')
  .select('*')
  .eq('Request ID', orderData['Request ID'] || id)
    setDetails(detailsData || [])

    if(!detailsData?.length &&!orderData) return

    // ✅ جيب بس المنتجات والمتاجر يلي بهالاوردر - مو كل الجدول
    const productIds = [...new Set((detailsData||[]).map(d=> String(d['Product ID']).trim()))].filter(Boolean)
    const storeIds = [...new Set((detailsData||[]).map(d=> String(d['Store ID']).trim()))].filter(Boolean)
    const customerId = String(orderData['customer ID'] || orderData['Customer ID'] || '').trim()
    const areaId = String(orderData['Area'] || '').trim()
    const assignedDriver = String(orderData['Assigned Driver'] || '').trim()

    const [customersRes, productsRes, storesRes, areasRes, usersRes, driversRes] = await Promise.all([
      customerId? supabase.from('customers').select('*').eq('Customer ID', customerId).maybeSingle() : { data: null },
      productIds.length? supabase.from('products').select('*').in('Product ID', productIds) : { data: [] },
      storeIds.length? supabase.from('stores').select('"Store ID", "Store Name"').in('Store ID', storeIds) : { data: [] },
      areaId? supabase.from('areas').select('*').eq('Area ID', areaId).maybeSingle() : { data: null },
      assignedDriver? supabase.from('users').select('*').eq('Related ID', assignedDriver).maybeSingle() : { data: null },
      assignedDriver? supabase.from('drivers').select('*').eq('Driver ID', assignedDriver).maybeSingle() : { data: null },
    ])

    const pMap = {}
    productsRes.data?.forEach(p=>{
      pMap[String(p['Product ID']).trim()] = p['Products Name'] || p['Product Name'] || p['Name']
    })
    const sMap = {}
    storesRes.data?.forEach(s=>{
      sMap[String(s['Store ID']).trim()] = s['Store Name']
    })

    const cMap = {}
    if(customersRes.data){
      cMap[customerId] = customersRes.data['Name'] || customersRes.data['Customer Name'] || customerId
    }

    const aMap = {}
    if(areasRes.data){
      aMap[areaId] = areasRes.data['Area Name'] || areasRes.data['Name'] || areaId
    }

    const dMap = {}
    const uMap = {}
    if(usersRes.data){
      uMap[assignedDriver] = usersRes.data['Name'] || usersRes.data['User'] || assignedDriver
    }
    if(driversRes.data){
      dMap[assignedDriver] = driversRes.data['Driver Name'] || driversRes.data['Name'] || assignedDriver
    }

    setNames({
      customers: cMap,
      products: pMap,
      stores: sMap,
      areas: aMap,
      users: uMap,
      drivers: dMap,
      customerRow: customersRes.data,
      areaRow: areasRes.data,
      userRow: usersRes.data,
      driverRow: driversRes.data,
    })
  }

  if (!order) return <div className="p-6">Loading... {id}</div>

  const totalQty = details.reduce((sum, d) => sum + Number(d['Qty'] || 0), 0)
  const totalLineTotal = details.reduce((sum, d) => sum + Number(d['Line Total'] || 0), 0)
  const totalWeight = details.reduce((sum, d) => sum + Number(d['Line Weight'] || d['Qty'] || 0), 0)
  const itemsCost = details.reduce((sum, d) => sum + Number(d['Line Total'] || 0), 0)
  const deliveryFee = Number(order['Delivery Fee'] || 0)
  const totalAmount = Number(order['Total Amount'] || 0) || itemsCost + deliveryFee

  const customerName = names.customers[order['customer ID']] || names.customers[order['Customer ID']] || order['customer ID'] || '-'
  const areaName = names.areas[order['Area']] || order['Area'] || '-'
  const driverName = names.users[order['Assigned Driver']] || names.drivers[order['Assigned Driver']] || order['Assigned Driver'] || 'لم يتم التعيين'
  const customerMobile = names.customerRow?.['Mobile'] || order['Mobile'] || '-'

  const formatDate = (d)=>{
    if(!d) return '-'
    try{
      const dt = new Date(d);
      return dt.toLocaleDateString('ar-LB') + ' ' + dt.toLocaleTimeString('ar-LB',{hour:'2-digit', minute:'2-digit'})
    }catch{
      return String(d).split('T')[0] + ' ' + String(d).split('T')[1]?.slice(0,5) || String(d).slice(0,16)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: absolute; left:0; top:0; width:100%; background:white; padding:20px; }
        .no-print { display:none!important; }
        }
      `}</style>

      <div className="p-6 max-w-2xl mx-auto">
        <div className="no-print flex justify-between items-center mb-4">
          <Link href="/admin/active-orders" className="text-blue-600">← Back</Link>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-gray-800">🖨️ طباعة الفاتورة / PDF</button>
        </div>

        <div id="invoice-print">
          <div className="bg-white p-6 rounded-lg shadow border mb-6 print:shadow-none print:border">
            <div className="flex justify-between items-start mb-4 border-b pb-4">
              <div>
                <h1 className="text-2xl font-bold">فاتورة #{String(order['Request ID']).slice(0,8)}</h1>
                <p className="text-gray-500 text-sm mt-1">التاريخ: {formatDate(order['Request Date'] || order['Cerated Date'])}</p>
                <p className="text- text-gray-400 mt-1">#{order['Request ID']}</p>
              </div>
              <div className="text-right">
                <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center font-black">MD</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">الزبون</span><span className="font-bold">{customerName}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">المنطقة</span><span className="font-medium">{areaName}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">العنوان</span><span className="font-medium truncate max-w-">{order['Delivery Adress']}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">الجوال</span><span className="font-medium">{customerMobile}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">السائق</span><span className="font-bold text-blue-600">{driverName}</span></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">حالة الموافقة</span><span className="font-medium">{order['Approval Status']}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">حالة التوصيل</span><span className="font-medium">{order['Delivery Status']}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">اجمالي الكمية</span><span className="font-bold">{totalQty}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">اجمالي الوزن</span><span className="font-bold text-blue-600">{totalWeight}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">رسوم التوصيل</span><span className="font-bold">{deliveryFee} ل.ل</span></div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 bg-gray-50 p-3 rounded-xl print:bg-gray-100">
              <span className="font-bold">الاجمالي النهائي (بضاعة + توصيل)</span>
              <span className="font-black text-lg">{totalAmount} ل.ل</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border print:shadow-none print:border">
            <h2 className="font-bold mb-4">تفاصيل البضاعة ({details.length}) - بالاسم بدال الرمز</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-gray-500 text-xs">
                  <th className="p-3 text-right">اسم المنتج</th>
                  <th className="p-3 text-right">المتجر</th>
                  <th className="p-3 text-center">الكمية</th>
                  <th className="p-3 text-center">سعر الوحدة</th>
                  <th className="p-3 text-left">الاجمالي</th>
                </tr>
              </thead>
              <tbody>
                {details.map(d => {
                  const productName = names.products[String(d['Product ID']).trim()] || d['Product ID']
                  const storeName = names.stores[String(d['Store ID']).trim()] || d['Store ID']
                  return (
                    <tr key={d['Detail ID']} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{productName}</td>
                      <td className="p-3 text-gray-600">{storeName}</td>
                      <td className="p-3 text-center">{d['Qty']}</td>
                      <td className="p-3 text-center">{d['Unit Price']}</td>
                      <td className="p-3 text-left font-bold">{d['Line Total']}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="mt-4 flex justify-between font-bold border-t pt-3">
              <span>المجموع (بضاعة: {itemsCost} + توصيل: {deliveryFee})</span>
              <span>{totalAmount} ل.ل</span>
            </div>
          </div>

          <div className="hidden print:block mt-10 text-center text-xs text-gray-500 border-t pt-4">
            MD Marketplace - كشف حساب نظامي - {new Date().toLocaleString('ar-EG')}
          </div>
        </div>
      </div>
    </div>
  )
}

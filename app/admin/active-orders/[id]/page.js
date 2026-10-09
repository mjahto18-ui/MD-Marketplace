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
  const [names, setNames] = useState({ customers: {}, products: {}, stores: {}, areas: {} })

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
    setOrder(orderData)

    const { data: detailsData } = await supabase
   .from('order_details')
   .select('*')
   .eq('Request ID', id)
    setDetails(detailsData || [])

    if(!detailsData?.length) return

    // ✅ جيب بس المنتجات والمتاجر يلي بهالاوردر - مو كل الجدول
    const productIds = [...new Set(detailsData.map(d=> String(d['Product ID']).trim()))]
    const storeIds = [...new Set(detailsData.map(d=> String(d['Store ID']).trim()))]

    const [customersRes, productsRes, storesRes, areasRes] = await Promise.all([
      supabase.from('customers').select('*').eq('Customer ID', orderData['customer ID']).maybeSingle(),
      supabase.from('products').select('*').in('Product ID', productIds),
      supabase.from('stores').select('"Store ID", "Store Name"').in('Store ID', storeIds),
      supabase.from('areas').select('*').eq('Area ID', orderData['Area']).maybeSingle()
    ])

    const pMap = {}
    productsRes.data?.forEach(p=>{
      pMap[String(p['Product ID']).trim()] = p['Products Name'] || p['Product Name'] || p['Name']
    })
    const sMap = {}
    storesRes.data?.forEach(s=>{
      sMap[String(s['Store ID']).trim()] = s['Store Name']
    })

    setNames({
      customers: { [orderData['customer ID']]: customersRes.data?.['Name'] || orderData['customer ID'] },
      products: pMap,
      stores: sMap,
      areas: { [orderData['Area']]: areasRes.data?.['Area Name'] || orderData['Area'] }
    })
  }

  if (!order) return <div className="p-6">Loading...</div>

  const totalQty = details.reduce((sum, d) => sum + Number(d['Qty'] || 0), 0)
  const totalLineTotal = details.reduce((sum, d) => sum + Number(d['Line Total'] || 0), 0)
  const totalWeight = details.reduce((sum, d) => sum + Number(d['Line Weight'] || d['Qty'] || 0), 0)
  const customerName = names.customers[order['customer ID']] || order['customer ID']
  const areaName = names.areas[order['Area']] || order['Area']

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
                <h1 className="text-2xl font-bold">فاتورة #{order['Request ID']}</h1>
                <p className="text-gray-500 text-sm mt-1">التاريخ: {order['Request Date'] || order['Order Date'] || new Date().toLocaleDateString('ar-EG')}</p>
              </div>
              <div className="text-right">
                <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center font-black">MD</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">الزبون</span><span className="font-bold">{customerName}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">المنطقة</span><span className="font-medium">{areaName}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">العنوان</span><span className="font-medium">{order['Delivery Adress']}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">الجوال</span><span className="font-medium">{order['Mobile']}</span></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">حالة الموافقة</span><span className="font-medium">{order['Approval Status']}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">حالة التوصيل</span><span className="font-medium">{order['Delivery Status']}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">اجمالي الكمية</span><span className="font-bold">{totalQty}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-gray-500">اجمالي الوزن</span><span className="font-bold text-blue-600">{totalWeight}</span></div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 bg-gray-50 p-3 rounded-xl print:bg-gray-100">
              <span className="font-bold">الاجمالي النهائي</span>
              <span className="font-black text-lg">{order['Total Amount'] || totalLineTotal} ل.ل</span>
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
              <span>المجموع</span>
              <span>{totalLineTotal} ل.ل</span>
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

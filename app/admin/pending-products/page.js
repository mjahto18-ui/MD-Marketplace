"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import BackToDashboard from "@/components/BackToDashboard"

export default function PendingProductsPage() {
  const [products, setProducts] = useState([])
  const [stores, setStores] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [edit, setEdit] = useState(null) // المنتج يلي عم تعدل عليه
  const [imagesMap, setImagesMap] = useState({})
  
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const fetchData = async () => {
    setLoading(true)
    // جيب كلشي Active = FALSE - سواء نص او بوليان
    const { data: prod } = await supabase
     .from('products')
     .select('*')
     .or('Active.eq.FALSE,Active.eq.false,Active.eq.FALSE,Active.is.null')
     .order('_supa_synced_at', { ascending: false })
     .limit(500)

    // فلتر زيادة بالـ JS لان عندك نوعين TRUE/FALSE نص و بوليان
    const filtered = (prod || []).filter(p => {
      const a = String(p.Active).toUpperCase()
      return a === 'FALSE' || a === 'FALSE' || p.Active === false || p.Active === null || p.Active === ''
    })

    setProducts(filtered)

        // جيب الصور المتعددة لكل المنتجات
    if (filtered.length) {
      const pIds = filtered.map(p => p['Product ID']).filter(Boolean)
      const { data: imgs } = await supabase
        .from('product_images')
        .select('product_id, image_url, sort_order')
        .in('product_id', pIds)
        .order('sort_order', { ascending: true })
      const map = {}
      ;(imgs||[]).forEach(im => {
        if (!map[im.product_id]) map[im.product_id] = []
        map[im.product_id].push(im.image_url)
      })
      setImagesMap(map)
    }
    if(filtered.length){
      const storeIds = [...new Set(filtered.map(p=>p['Store ID']).filter(Boolean))]
      if(storeIds.length){
        const { data: storeData } = await supabase.from('stores').select('"Store ID","Store Name"').in('Store ID', storeIds)
        const map = {}
        storeData?.forEach(s => map[s['Store ID']] = s['Store Name'])
        setStores(map)
      }
    }
    setLoading(false)
  }

  useEffect(()=>{ fetchData() },[])

  const saveApprove = async () => {
    if(!edit) return
    // هون انت بتحط الوزن والصورة والـ Active TRUE
    const payload = {
      'Product Name': edit['Product Name'],
      'Price': edit['Price'] === ''? null : Number(edit['Price']),
      'Weight Points': edit['Weight Points'] === ''? null : Number(edit['Weight Points']),
      'Image': edit['Image'] || null,
      'Description': edit['Description'] || null,
      'Category': edit['Category'] || null,
      'Unit': edit['Unit'] || null,
      'Active': 'TRUE' // فقسة الاكتف - من بعد ما تحط وزن وصورة
    }

    const { error } = await supabase.from('products').update(payload).eq('Product ID', edit['Product ID'])
    if(error) return alert(error.message)

    // الـ trigger trg_product_approved رح يشتغل لحالو بعد الـ update
    setProducts(prev => prev.filter(p=> p['Product ID']!== edit['Product ID']))
    setEdit(null)
    alert('تمت الموافقة وصار TRUE')
  }

  const reject = async (id) => {
    if(!confirm('تحذف المنتج؟')) return
    const { error } = await supabase.from('products').delete().eq('Product ID', id)
    if(!error) setProducts(prev => prev.filter(p=> p['Product ID']!== id))
  }

  const list = products.filter(p =>
    (p['Product Name']||'').toLowerCase().includes(search.toLowerCase()) ||
    (p['Product ID']||'').toLowerCase().includes(search.toLowerCase()) ||
    (p['Store ID']||'').toLowerCase().includes(search.toLowerCase())
  )

  if(loading) return <div className="p-6">جاري التحميل...</div>

  return (
    <div className="p-6">
      <BackToDashboard />
      <h1 className="text-2xl font-bold mb-2">منتجات بانتظار المراجعة FALSE / INACTIVE</h1>
      <p className="text-sm text-gray-500 mb-4">{products.length} منتج بدو وزن وصورة وموافقة</p>

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث اسم / باركود / Store ID..." className="w-full p-3 border rounded-lg mb-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map(p=>(
          <div key={p['Product ID']} className="bg-white rounded-xl shadow border p-3 flex flex-col">
                        <div className="bg-gray-50 rounded-lg h-32 flex items-center justify-center overflow-hidden mb-2 relative">
              {p['Image']? <img src={p['Image']} className="max-h-full object-contain"/> : <span className="text-gray-400 text-xs">بلا صورة</span>}
              {p['Size'] && <span className="absolute top-2 right-2 bg-amber-300 text-black text-[11px] font-black px-2 py-1 rounded-full">مقاس: {p['Size']}</span>}
              {(imagesMap[p['Product ID']]?.length > 1) && <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">{imagesMap[p['Product ID']].length} صور</span>}
            </div>
            {/* صور مصغرة - كل الصور */}
            {imagesMap[p['Product ID']]?.length > 1 && (
              <div className="flex gap-1 mb-2 overflow-x-auto">
                {imagesMap[p['Product ID']].map((img, i) => (
                  <img key={i} src={img} className="w-10 h-10 object-cover rounded border" />
                ))}
              </div>
            )}
            <div className="font-bold text-sm truncate">{p['Product Name']}</div>
            <div className="text-xs text-gray-500">{stores[p['Store ID']] || p['Store ID']} | {p['Category'] || '-'} | {p['Unit']} {p['Size'] ? `| مقاس: ${p['Size']}` : ''}</div>
            <div className="text-xs mt-1">سعر: {p['Price']} | وزن: {p['Weight Points'] || 'ما في'} | باركود: <span className="font-mono">{p['Product ID'].slice(0,8)}</span></div>
            <div className="flex gap-2 mt-3">
              <button onClick={()=>setEdit(p)} className="flex-1 bg-black text-white text-xs py-2 rounded-lg font-bold">مراجعة وتفعيل ✓</button>
              <button onClick={()=>reject(p['Product ID'])} className="px-3 bg-red-50 text-red-600 text-xs py-2 rounded-lg">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {list.length===0 && <div className="text-center p-10 bg-white rounded-xl mt-4">ما في منتجات FALSE</div>}

      {/* مودال التعديل */}
      {edit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 max-h- overflow-y-auto">
            <h2 className="font-black mb-4">تعديل وموافقة - {edit['Product ID'].slice(0,8)}</h2>

            <label className="text-xs font-bold">اسم المنتج</label>
            <input value={edit['Product Name']||''} onChange={e=>setEdit({...edit, 'Product Name':e.target.value})} className="w-full p-2 border rounded mb-2" />

            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-bold">السعر</label><input value={edit['Price']||''} onChange={e=>setEdit({...edit, Price:e.target.value})} className="w-full p-2 border rounded mb-2" /></div>
              <div><label className="text-xs font-bold">Weight Points (الوزن)</label><input type="number" value={edit['Weight Points']||''} onChange={e=>setEdit({...edit, 'Weight Points':e.target.value})} className="w-full p-2 border rounded mb-2 bg-yellow-50 border-yellow-300" placeholder="مثال 0.5" /></div>
            </div>

            <label className="text-xs font-bold">Category</label>
            <input value={edit['Category']||''} onChange={e=>setEdit({...edit, Category:e.target.value})} className="w-full p-2 border rounded mb-2" />

                        {/* مقاس + صور المتجر */}
            {edit['Size'] && <div className="mb-2"><span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">📏 المقاس اللي بعتو المتجر: {edit['Size']}</span></div>}
            {imagesMap[edit['Product ID']]?.length > 0 && (
              <div className="mb-3">
                <label className="text-xs font-bold">صور المتجر ({imagesMap[edit['Product ID']].length})</label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {imagesMap[edit['Product ID']].map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img} className="w-16 h-16 object-cover rounded border" />
                      <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] px-1.5 rounded-full">{i===0 ? 'رئيسية' : i+1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="text-xs font-bold">رابط الصورة Image (انت بتحطا)</label>
            <input value={edit['Image']||''} onChange={e=>setEdit({...edit, Image:e.target.value})} className="w-full p-2 border rounded mb-2" />
            {edit['Image'] && <img src={edit['Image']} className="h-24 object-contain border rounded mb-2" />}

            <label className="text-xs font-bold">Description</label>
            <textarea value={edit['Description']||''} onChange={e=>setEdit({...edit, Description:e.target.value})} className="w-full p-2 border rounded mb-3" rows={2}></textarea>

            <div className="flex gap-2">
              <button onClick={()=>setEdit(null)} className="flex-1 py-2.5 border rounded-xl text-sm">إلغاء</button>
              <button onClick={saveApprove} className="flex-[2] py-2.5 bg-green-600 text-white rounded-xl text-sm font-black">حط وزن وصورة + فعّل TRUE ✓</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">بعد الكبسة الـ trigger trg_product_approved رح يشتغل لحالو</p>
          </div>
        </div>
      )}
    </div>
  )
}

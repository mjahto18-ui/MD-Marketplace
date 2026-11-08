import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function POST(req) {
  try {
    const { customerID, orderText, storeHint, quantity, note, addressType, areaID, deliveryAddress, lat, lng, imageUrl } = await req.json();
    if (!customerID || !orderText) return Response.json({ success: false, message: 'ناقص بيانات' }, { status: 400 });

    // جيب الزبون - للعنوان الثابت منجيب موقعه من جدول customers
    const { data: cust } = await supabase.from('customers').select('*').eq('"Customer ID"', customerID).single();
    // جرب اسماء مختلفة للعمود حسب جدولك - اذا ما لقيت، استعمل اللي فوق
    let finalLat = lat, finalLng = lng, finalAddress = deliveryAddress, finalArea = areaID;
    if (addressType === 'fixed') {
      if (cust) {
        finalLat = cust['Customer Latitude'] || cust['Latitude'] || "";
        finalLng = cust['Customer Longitude'] || cust['Longitude'] || "";
        finalAddress = cust['Delivery Adress'] || cust['Address'] || deliveryAddress;
        finalArea = cust['Area'] || areaID;
      }
    }
    if (!finalLat || !finalLng) return Response.json({ success: false, message: 'ما قدرنا نجيب موقعك' }, { status: 400 });

    // فحص الجيو فينس - نفس API اللي بعتو - cart service
    const centersRes = await supabase.from('geofence_centers').select('*').eq('is_active', true).eq('cart_enabled', true);
    let centerId = null, allowed = false;
    for (let c of (centersRes.data || [])) {
      const dist = getDistance(parseFloat(finalLat), parseFloat(finalLng), c.center_lat, c.center_lng);
      if (dist <= c.radius_cart) { allowed = true; centerId = c.id; break; }
    }
    if (!allowed) return Response.json({ success: false, message: 'خارج نطاق التغطية حالياً' }, { status: 403 });

    const { data, error } = await supabase.from('special_orders').insert([{
      "customer ID": customerID,
      "Customer Name": cust?.['Customer Name'] || cust?.Name || "",
      "Mobile": cust?.Mobile || "",
      "الطلب": orderText,
      "Store Hint": storeHint || null,
      "Quantity": quantity || 1,
      "ملاحظات عامة": note || null,
      "صورة": imageUrl || null,
      "Delivery Adress": finalAddress,
      "Area": finalArea,
      "Customer Latitude": String(finalLat),
      "Customer Longitude": String(finalLng),
      "Address Type": addressType,
      geofence_center_id: centerId,
      "Status": "Pending"
    }]).select().single();

    if (error) throw error;
    return Response.json({ success: true, request_id: data["Request ID"] });
  } catch (e) {
    console.error(e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

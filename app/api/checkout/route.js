export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { customerID, areaID, deliveryAddress, note, addressType, lat, lng } = body;

    if (!customerID ||!addressType) {
      return NextResponse.json({ success: false, message: "نوع العنوان غير محدد" }, { status: 400 });
    }

    const supabase = getSupabase();

    const [
      { data: cartRowsRaw },
      { data: customerRows },
      { data: deliveryRatesRows },
      { data: areasRows },
    ] = await Promise.all([
      supabase.from('cart').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('delivery_rates').select('*'),
      supabase.from('areas').select('*'),
    ]);

    // سلة الزبون
    const customerCart = (cartRowsRaw||[]).filter(
      (row) => String(row["Customer ID"] || "").trim() === String(customerID).trim() && String(row["Checked Out"] || "FALSE").trim().toUpperCase() === "FALSE"
    );

    if (customerCart.length === 0) {
      return NextResponse.json({ success: false, message: "السلة فاضية" }, { status: 400 });
    }

    // الوزن
    let totalWeight = 0;
    const cartWithProducts = customerCart.map(row => {
      const qty = Number(row["Qty"] || 0);
      const linePoints = Number(row["Line Points"] || 0);
      const lineTotal = Number(row["Line Total"] || 0);
      const unitPrice = qty > 0? lineTotal / qty : 0;
      totalWeight += qty * linePoints;
      return {
        productID: row["Product ID"],
        qty,
        linePoints,
        unitPrice,
        lineTotal,
        storeID: row["Store ID"],
      };
    });

    // بيانات الزبون + Delivery Fee
    const customer = (customerRows||[]).find((row) => String(row["Customer ID"] || "").trim() === String(customerID).trim());
    if (!customer) {
      return NextResponse.json({ success: false, message: "الزبون غير موجود" }, { status: 400 });
    }

    const freeDeliveryRemaining = Number(customer["Free Delivery Remaining"] || 0);
    // ملاحظة: Last Free Delivery Date مو موجود بجدول customers اللي بعته، تركته متل ما هو اذا ضفته انت
    const lastFreeDeliveryDate = customer["Last Free Delivery Date"] || "";
    const today = new Date().toLocaleDateString("en-GB");

    const rateRow = (deliveryRatesRows||[]).find((row) => {
      const min = Number(row["Min Points"] || 0);
      const max = Number(row["Max Points"] || 999999);
      return totalWeight >= min && totalWeight <= max;
    });

    const baseDeliveryFee = rateRow? Number(rateRow["Delivery Fee"] || 0) : 0;
    const isFreeDelivery = freeDeliveryRemaining > 0 && totalWeight <= 10 && lastFreeDeliveryDate!== today;
    const deliveryFee = isFreeDelivery? 0 : baseDeliveryFee;

    // تجهيز ID وتواريخ
    const requestID = crypto.randomUUID().replace(/-/g, "").substring(0, 8);
    const now = new Date();
    const requestDate = now.toISOString(); // Request Date هو timestamp with time zone
    const createdDate = now.toLocaleDateString("en-GB"); // Cerated Date هو text

    // تحديد المنطقة والعنوان واللوكيشن
    let finalAreaID = String(areaID || "").trim();
    let finalAddress = deliveryAddress || "";
    let finalNote = note || "";
    let finalLat = lat || "";
    let finalLng = lng || "";

    if (addressType === "fixed") {
      const customerArea = String(customer["Area"] || "").trim(); // هون بكون fr7455fr5
      const customerAddress = customer["Adress"] || "";
      const customerLat = customer["Current Latitude"] || "";
      const customerLng = customer["Current Longtitude"] || ""; // مع t زيادة حسب جدولك

      const areaExists = (areasRows||[]).some(row => String(row["Area ID"] || "").trim() === String(customerArea).trim() || String(row["Area Name"] || "").trim() === String(customerArea).trim());

      if (!areaExists) {
        return NextResponse.json({ success: false, message: "عذراً، منطقتك الحالية غير مدعومة للتوصيل" }, { status: 400 });
      }

      finalAreaID = customerArea;
      finalAddress = customerAddress;
      finalNote = "";
      finalLat = customerLat;
      finalLng = customerLng;
    } else if (addressType === "new") {
      if (!finalAreaID ||!finalAddress) {
        return NextResponse.json({ success: false, message: "تأكد من تعبئة المنطقة والعنوان" }, { status: 400 });
      }
      if (!finalLat ||!finalLng) {
        return NextResponse.json({ success: false, message: "ما قدرنا نحدد موقعك، جرّب مرة تانية" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ success: false, message: "نوع العنوان غير معروف" }, { status: 400 });
    }

    // 7) نسخ الطلب على order_requuest - بالأسماء الصحيحة 100% مع الأخطاء الإملائية اللي بالـ DB
    const orderRow = {
      "Request ID": requestID,
      "customer ID": customerID, // c صغير حسب جدولك
      "Area": String(finalAreaID), // هون بنخزن fr7455fr5
      "Cerated Date": createdDate, // Cerated بدون a حسب جدولك
      "Note": finalNote,
      "Delivery Adress": String(finalAddress), // Adress بحرف واحد حسب جدولك
      "Delivery Fee": deliveryFee,
      "Approval Status": "Pending",
      "Request Date": requestDate,
      "Delivery Status": "Pending",
      "Customer Latitude": finalLat,
      "Customer Longitude": finalLng,
      "Mobile": customer["Mobile"] || "",
    };

    let { error: orderErr } = await supabase.from('order_requuest').insert([orderRow]);
    if (orderErr) throw orderErr;

    // 8) نسخ تفاصيل الطلب على order_details
    const detailRows = cartWithProducts.map(item => ({
      "Detail ID": crypto.randomUUID().replace(/-/g, "").substring(0, 8),
      "Request ID": requestID,
      "Product ID": item.productID,
      "Qty": String(item.qty),
      "Unit Price": String(item.unitPrice),
      "Line Total": String(item.lineTotal),
      "Store ID": item.storeID,
      "Costumer ID": customerID, // Costumer بدون t حسب جدولك
      "Area": finalAreaID, // fr7455fr5
      "Commission Amount": String(item.lineTotal * 0.1),
    }));

    if (detailRows.length > 0) {
      let { error } = await supabase.from('order_details').insert(detailRows);
      if (error) throw error;
    }

    // 9) مسح سلة الزبون
    await supabase.from('cart').delete().eq('Customer ID', customerID).eq('Checked Out', 'FALSE');

    // لعرض اسم المنطقة بعدين: اعمل lookup
    // const areaName = areasRows.find(a => a["Area ID"] === finalAreaID)?.["Area Name"]

    return NextResponse.json({
      success: true,
      request_id: requestID,
      delivery_fee: deliveryFee,
      area_id: finalAreaID,
      message: "تم ارسال طلبك للمراجعة",
    });

  } catch (err) {
    console.error("Checkout Error:", err);
    return NextResponse.json({ success: false, message: "صار خطأ، جرب مرة تانية", error: err.message }, { status: 500 });
  }
}

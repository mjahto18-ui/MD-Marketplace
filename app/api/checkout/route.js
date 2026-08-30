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

    // 1) جلب البيانات من Supabase
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

    // 2) سلة الزبون - نفس المنطق
    const customerCart = (cartRowsRaw||[]).filter(
      (row) => String(row["Customer ID"] || row["customer_id"] || "").trim() === String(customerID).trim() && String(row["Checked Out"] || row["checked_out"] || "FALSE").trim().toUpperCase() === "FALSE"
    );

    if (customerCart.length === 0) {
      return NextResponse.json({ success: false, message: "السلة فاضية" }, { status: 400 });
    }

    // 3) الوزن
    let totalWeight = 0;
    const cartWithProducts = customerCart.map(row => {
      const qty = Number(row["Qty"] || row["qty"] || 0);
      const linePoints = Number(row["Line Points"] || row["line_points"] || 0);
      const lineTotal = Number(row["Line Total"] || row["line_total"] || 0);
      const unitPrice = qty > 0? lineTotal / qty : 0;
      totalWeight += qty * linePoints;
      return {
        productID: row["Product ID"] || row["product_id"],
        qty,
        linePoints,
        unitPrice,
        lineTotal,
        storeID: row["Store ID"] || row["store_id"],
      };
    });

    // 4) بيانات الزبون + Delivery Fee - نفس المنطق
    const customer = (customerRows||[]).find((row) => String(row["Customer ID"] || row["customer_id"] || row["ID"] || "").trim() === String(customerID).trim());
    if (!customer) {
      return NextResponse.json({ success: false, message: "الزبون غير موجود" }, { status: 400 });
    }

    const freeDeliveryRemaining = Number(customer["Free Delivery Remaining"] || customer["free_delivery_remaining"] || customer[8] || 0);
    const lastFreeDeliveryDate = customer["Last Free Delivery Date"] || customer["last_free_delivery_date"] || customer[23] || "";
    const today = new Date().toLocaleDateString("en-GB");

    const rateRow = (deliveryRatesRows||[]).find((row) => {
      const min = Number(row["Min"] || row["min"] || row["Min Weight"] || row[1] || 0);
      const max = Number(row["Max"] || row["max"] || row["Max Weight"] || row[2] || 999999);
      return totalWeight >= min && totalWeight <= max;
    });

    const baseDeliveryFee = rateRow? Number(rateRow["Fee"] || rateRow["fee"] || rateRow["Delivery Fee"] || rateRow[3] || 0) : 0;
    const isFreeDelivery = freeDeliveryRemaining > 0 && totalWeight <= 10 && lastFreeDeliveryDate!== today;
    const deliveryFee = isFreeDelivery? 0 : baseDeliveryFee;

    // 5) تجهيز ID وتواريخ - نفس المنطق
    const requestID = crypto.randomUUID().replace(/-/g, "").substring(0, 8);
    const now = new Date();
    const requestDate = now.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(",", "");
    const createdDate = now.toLocaleDateString("en-GB");

    // 6) تحديد المنطقة والعنوان واللوكيشن حسب نوع العنوان - نفس المنطق 100%
    let finalAreaID = String(areaID || "").trim();
    let finalAddress = deliveryAddress || "";
    let finalNote = note || "";
    let finalLat = lat || "";
    let finalLng = lng || "";

    if (addressType === "fixed") {
      const customerArea = String(customer["Area"] || customer["area"] || customer["Area ID"] || "").trim();
      const customerAddress = customer["Adress"] || customer["Address"] || customer["Delivery Address"] || "";
      const customerLat = customer["Current Latitude"] || customer["current_latitude"] || customer["Latitude"] || customer[11] || "";
      const customerLng = customer["Current Longitude"] || customer["current_longitude"] || customer["Longitude"] || customer[12] || "";

      const areaExistsByID = (areasRows||[]).some(row => String(row["Area ID"] || row["area_id"] || row[0] || "").trim() === String(customerArea).trim());
      const areaExistsByName = (areasRows||[]).some(row => String(row["Area Name"] || row["area_name"] || row[1] || "").trim() === String(customerArea).trim());
      const areaExists = areaExistsByID || areaExistsByName;

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

    // 7) نسخ الطلب على Order requuest من Supabase
    const orderRow = {
      "Request ID": requestID,
      "Customer ID": customerID,
      "Area": String(finalAreaID),
      "Created Date": createdDate,
      "Note": finalNote,
      "Delivery Adress": String(finalAddress),
      "Delivery Fee": deliveryFee,
      "Approval Status": "Pending",
      "Request Date": requestDate,
      "Checked": "FALSE",
      "Delivery Status": "Pending",
      "Payment Status": "Pending",
      "Is Free Delivery": isFreeDelivery? "TRUE" : "FALSE",
      "Free Delivery Count": 0,
      "Customer Phone": customer["Mobile"] || customer["Phone"] || "",
      "Customer Latitude": finalLat,
      "Customer Longitude": finalLng,
    };
    // fallback lowercase
    const orderRowLower = {
      request_id: requestID,
      customer_id: customerID,
      area: String(finalAreaID),
      created_date: createdDate,
      note: finalNote,
      delivery_address: String(finalAddress),
      delivery_fee: deliveryFee,
      approval_status: "Pending",
      request_date: requestDate,
      checked: false,
      delivery_status: "Pending",
      payment_status: "Pending",
      is_free_delivery: isFreeDelivery,
      customer_latitude: finalLat,
      customer_longitude: finalLng,
    };

    let { error: orderErr } = await supabase.from('order_requuest').insert([orderRow]);
    if (orderErr) {
      const { error: err2 } = await supabase.from('order_requuest').insert([orderRowLower]);
      if (err2) throw err2;
    }

    // 8) نسخ تفاصيل الطلب على Order Details
    const detailRows = cartWithProducts.map(item => ({
      "Detail ID": crypto.randomUUID().replace(/-/g, "").substring(0, 8),
      "Request ID": requestID,
      "Product ID": item.productID,
      "Qty": item.qty,
      "Unit Price": item.unitPrice,
      "Line Total": item.lineTotal,
      "Store ID": item.storeID,
      "Customer ID": customerID,
      "Area": finalAreaID,
      "Commission Amount": item.lineTotal * 0.1,
    }));

    if (detailRows.length > 0) {
      let { error } = await supabase.from('order_details').insert(detailRows);
      if (error) {
        const lowerRows = detailRows.map(r => ({
          detail_id: r["Detail ID"],
          request_id: r["Request ID"],
          product_id: r["Product ID"],
          qty: r["Qty"],
          unit_price: r["Unit Price"],
          line_total: r["Line Total"],
          store_id: r["Store ID"],
          customer_id: r["Customer ID"],
          area: r["Area"],
          commission_amount: r["Commission Amount"],
        }));
        await supabase.from('order_details').insert(lowerRows);
      }
    }

    // 9) مسح سلة الزبون من Supabase
    await supabase.from('cart').delete().eq('Customer ID', customerID).eq('Checked Out', 'FALSE');
    await supabase.from('cart').delete().eq('customer_id', customerID).eq('checked_out', false);

    return NextResponse.json({
      success: true,
      request_id: requestID,
      delivery_fee: deliveryFee,
      message: "تم ارسال طلبك للمراجعة",
    });

  } catch (err) {
    console.error("Checkout Error:", err);
    return NextResponse.json({ success: false, message: "صار خطأ، جرب مرة تانية", error: err.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function parseData(d){
  if(!d) return {};
  if(typeof d === 'object') return d;
  if(typeof d === 'string'){
    try{ return JSON.parse(d); }catch{ return {}; }
  }
  return {};
}

function fillTemplate(str, data){
  if(!str) return '';
  let out = str;
  // يبدل {{key}} و {{ key }} و {{key }} كلن
  for(const [k,v] of Object.entries(data)){
    out = out.replaceAll(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v ?? ''));
  }
  // نظف اي {{}} بقي فاضي
  out = out.replace(/{{\s*[^}]+\s*}}/g, '').replace(/\s{2,}/g,' ').trim();
  return out;
}

export async function POST(req) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const body = await req.json();
    console.log("========== PUSH QUEUE ==========", body);

    const queueId = body["Queue ID"];
    const userId = body["User ID"];
    const code = body["Code"];
    let orderId = body["Order ID"] || body["Order ID"] || '';
    let dataPayload = parseData(body["Data"]);

    if (!userId || !code) return NextResponse.json({ success: false, message: "Missing data" });

    const { data: user } = await supabase.from("users").select("*").eq("User ID", userId).single();
    if (!user?.["Subscription ID"]) return NextResponse.json({ success: false, message: "Subscription not found" });

    const { data: template } = await supabase.from("notification_templates").select("*").eq("Code", code).single();
    if (!template) return NextResponse.json({ success: false, message: "Template not found" });

    // ✅ اذا Data فاضي او ناقص، كمل من taxi_orders
    if (orderId) {
      const { data: order } = await supabase.from("taxi_orders").select("*").eq("id", orderId).single();
      if (order) {
        // كمل الناقص بس، ما تمحي الموجود
        dataPayload = {
          order_code: order.order_code || order.id?.slice(0,8),
          order_id: order.id,
          amount: order.total_amount ? Number(order.total_amount).toLocaleString() : '',
          origin: (order.origin_name||'').slice(0,30),
          dest: (order.dest_name||'').slice(0,30),
          distance: dataPayload.distance || dataPayload.distance_km || order.distance_traveled || '',
          distance_km: dataPayload.distance_km || dataPayload.distance || '',
          secret_code: order.secret_code || '',
          ...dataPayload, // الموجود ب push_queue بيغلب
          // aliases للتوافق
          orderCode: order.order_code,
        };
      }
    }

    // ✅ وحّد المفاتيح عشان القالب يلاقيها مهما كان الاسم
    const fullData = {
      ...dataPayload,
      distance: dataPayload.distance || dataPayload.distance_km || '',
      distance_km: dataPayload.distance_km || dataPayload.distance || '',
      origin: dataPayload.origin || dataPayload.origin_name || '',
      dest: dataPayload.dest || dataPayload.dest_name || '',
      amount: dataPayload.amount || '',
      order_code: dataPayload.order_code || dataPayload.orderCode || '',
      order_id: orderId || dataPayload.order_id || '',
    };

    let title = template["Title AR"] || '';
    let message = template["Message AR"] || '';

    title = fillTemplate(title, fullData);
    message = fillTemplate(message, fullData);

    const response = await fetch("https://api.onesignal.com/notifications?c=push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        include_subscription_ids: [user["Subscription ID"]],
        headings: { en: title },
        contents: { en: message },
        data: {
          type: code,
          order_id: orderId || fullData.order_id || '',
          order_code: fullData.order_code || '',
          click_action: orderId ? `/taxi/${orderId}` : '/orders',
          ...fullData
        },
      }),
    });

    const result = await response.json();
    if (queueId) await supabase.from("push_queue").update({ "Status": "Sent", "Sent At": new Date().toISOString(), "Response": JSON.stringify(result) }).eq("Queue ID", queueId);

    console.log("SENT:", title, message);
    return NextResponse.json({ success: true, title, message, result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message });
  }
}

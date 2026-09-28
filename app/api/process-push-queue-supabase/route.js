export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const body = await req.json();
    console.log("========== PUSH QUEUE ==========", body);

    const queueId = body["Queue ID"];
    const userId = body["User ID"];
    const code = body["Code"];
    const orderId = body["Order ID"];
    let dataPayload = body["Data"] || {};

    if (!userId || !code) return NextResponse.json({ success: false, message: "Missing data" });

    const { data: user } = await supabase.from("users").select("*").eq("User ID", userId).single();
    if (!user?.["Subscription ID"]) return NextResponse.json({ success: false, message: "Subscription not found" });

    const { data: template } = await supabase.from("notification_templates").select("*").eq("Code", code).single();
    if (!template) return NextResponse.json({ success: false, message: "Template not found" });

    let title = template["Title AR"];
    let message = template["Message AR"];

    // ✅ إذا ما في Data بس في Order ID، جيب البيانات من taxi_orders
    if (orderId && Object.keys(dataPayload).length === 0) {
      const { data: order } = await supabase.from("taxi_orders").select("*").eq("id", orderId).single();
      if (order) {
        dataPayload = {
          order_code: order.order_code,
          amount: Number(order.total_amount||0).toLocaleString(),
          origin: (order.origin_name||'').slice(0,25),
          dest: (order.dest_name||'').slice(0,25),
          secret_code: order.secret_code,
          scheduled_time: new Date(order.requested_start_at).toLocaleTimeString('ar-LB',{hour:'2-digit',minute:'2-digit'}),
          distance: order.distance_traveled || ''
        };
      }
    }

    // ✅ عبّي القالب {{order_code}} {{amount}} ...
    for (const [k,v] of Object.entries(dataPayload)) {
      title = title.replaceAll(`{{${k}}}`, String(v));
      message = message.replaceAll(`{{${k}}}`, String(v));
    }

    // ✅ بعت OneSignal مع data ذكية للتطبيق
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
          order_id: orderId || '',
          click_action: orderId ? `/taxi/${orderId}` : '/orders',
          ...dataPayload
        },
        android: { priority: 10 },
        ios: { sound: "default" }
      }),
    });

    const result = await response.json();
    if (queueId) await supabase.from("push_queue").update({ "Status": "Sent", "Sent At": new Date().toISOString(), "Response": JSON.stringify(result) }).eq("Queue ID", queueId);

    return NextResponse.json({ success: true, title, message, result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message });
  }
}

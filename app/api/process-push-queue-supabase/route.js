import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("========== PUSH QUEUE SUPABASE ==========", body);

    const queueId = body.queueId || body.Queue_ID || body["Queue ID"];
    const userId = body.userId || body.User_ID || body["User ID"];
    const code = body.code || body.Code;

    if (!userId ||!code) {
      return NextResponse.json({ success: false, message: "Missing data" });
    }

    // 1. Users من Supabase
    const { data: user } = await supabase
     .from("users")
     .select("*")
     .eq("User ID", userId)
     .single();

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" });
    }

    const subscriptionId = user["Subscription ID"];
    console.log("Subscription =", subscriptionId);

    if (!subscriptionId) {
      return NextResponse.json({ success: false, message: "Subscription not found" });
    }

    // 2. Notification Templates من Supabase - نفس منطق القديم
    const { data: template } = await supabase
     .from("notification_templates")
     .select("*")
     .eq("Code", code)
     .single();

    console.log("Template =", template);

    if (!template) {
      return NextResponse.json({ success: false, message: "Template not found" });
    }

    const title = template["Title AR"];
    const message = template["Message AR"];

    console.log("Title =", title);
    console.log("Message =", message);

    // 3. OneSignal
    console.log("Sending OneSignal...");
    const response = await fetch("https://api.onesignal.com/notifications?c=push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        include_subscription_ids: [subscriptionId],
        headings: { en: title },
        contents: { en: message },
      }),
    });

    console.log("HTTP Status =", response.status);
    const result = await response.json();
    console.log("OneSignal Result =", result);

    if (queueId) {
      await supabase.from("push_queue").update({ Status: "Sent" }).eq("Queue ID", queueId);
    }

    return NextResponse.json({ success: true, result });

  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false, error: err.message });
  }
}

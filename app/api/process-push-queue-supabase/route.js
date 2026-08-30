export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const body = await req.json();
    console.log("========== PUSH QUEUE SUPABASE ==========", body);

    const queueId = body.queueId || body.Queue_ID || body["Queue ID"];
    const userId = body.userId || body.User_ID || body["User ID"];
    const code = body.code || body.Code;

    if (!userId ||!code) {
      return NextResponse.json({ success: false, message: "Missing data" });
    }

    const { data: user } = await supabase.from("users").select("*").eq("User ID", userId).single();
    if (!user) return NextResponse.json({ success: false, message: "User not found" });

    const subscriptionId = user["Subscription ID"] || user["subscription_id"];
    console.log("Subscription =", subscriptionId);

    if (!subscriptionId) {
      return NextResponse.json({ success: false, message: "Subscription not found" });
    }

    const { data: template } = await supabase.from("notification_templates").select("*").eq("Code", code).single();
    if (!template) return NextResponse.json({ success: false, message: "Template not found" });

    const title = template["Title AR"] || template["title_ar"];
    const message = template["Message AR"] || template["message_ar"];

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

    const result = await response.json();

    if (queueId) {
      await supabase.from("push_queue").update({ Status: "Sent", status: "Sent" }).eq("Queue ID", queueId);
    }

    return NextResponse.json({ success: true, result });

  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false, error: err.message });
  }
}

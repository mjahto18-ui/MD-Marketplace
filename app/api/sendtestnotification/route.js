import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { subscriptionId, title, message } = await req.json();

    const response = await fetch("https://api.onesignal.com/notifications?c=push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,

        include_subscription_ids: [
          subscriptionId
        ],

        headings: {
          en: title || "MD Marketplace",
        },

        contents: {
          en: message || "Test Notification",
        },
      }),
    });

    const data = await response.json();

    console.log(data);

    return NextResponse.json(data);

  } catch (err) {
    console.error(err);

    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}

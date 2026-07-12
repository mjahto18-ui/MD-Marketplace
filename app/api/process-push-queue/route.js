import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("========== PUSH QUEUE ==========");
    console.log(body);

    const {
      queueId,
      userId,
      customerId,
      code,
    } = body;

    if (!userId || !code) {
      return NextResponse.json({
        success: false,
        message: "Missing data",
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    });

    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    //==============================
    // Users
    //==============================

    const users = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Users!A:Q",
    });

    const userRows = users.data.values || [];

    const user = userRows.find(r => r[0] === userId);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      });
    }

    const subscriptionId = user[16];

    console.log("Subscription =", subscriptionId);
    console.log("searching Template...");

    if (!subscriptionId) {
      return NextResponse.json({
        success: false,
        message: "Subscription not found",
      });
    }

    //==============================
    // Notification Templates
    //==============================

    const templates = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Notification Templates!A:Z",
    });

    const templateRows = templates.data.values || [];

    const template = templateRows.find(r => r[0] === code);
    console.log("Template =", template);

    if (!template) {
      return NextResponse.json({
        success: false,
        message: "Template not found",
      });
    }

    const title = template[1];
    const message = template[2];
    const image = template[3];
    console.log("Title =", title);
    console.log("Message =", message);
    console.log("Image =", image);

    console.log(title);
    console.log(message);

    //==============================
    // OneSignal
    //==============================
    console.log("Sending OneSignal...");
    const response = await fetch(
      "https://api.onesignal.com/notifications?c=push",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: process.env.ONESIGNAL_APP_ID,

          include_subscription_ids: [
            subscriptionId,
          ],

          headings: {
            en: title,
          },

          contents: {
            en: message,
          },

          big_picture: image || undefined,
        }),
      }
    );
      console.log("HTTP Status =", response.status);
    const result = await response.json();
    consile.log("OneSignal Result =", result);

    console.log(result);

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (err) {
    console.log(err);

    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}

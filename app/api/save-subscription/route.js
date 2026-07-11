import { google } from "googleapis";

export async function POST(req) {
  try {
    const { userId, subscriptionId } = await req.json();

    if (!userId || !subscriptionId) {
      return Response.json({
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

    const read = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Users!A:Q",
    });

    const rows = read.data.values || [];

    // أولاً: إزالة Subscription ID من أي مستخدم آخر
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (
        row[16] === subscriptionId &&
        row[0] !== userId.toString()
      ) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Users!Q${i + 1}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[""]],
          },
        });
      }
    }

    // ثانياً: البحث عن المستخدم الحالي
    const rowIndex = rows.findIndex(
      (row) => row[0] === userId.toString()
    );

    if (rowIndex === -1) {
      return Response.json({
        success: false,
        message: "User not found",
      });
    }

    // ثالثاً: حفظ Subscription ID للمستخدم الحالي
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Users!Q${rowIndex + 2}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[subscriptionId]],
      },
    });

    return Response.json({
      success: true,
      message: "Subscription updated",
    });

  } catch (err) {
    console.error(err);

    return Response.json({
      success: false,
      message: "Server error",
    });
  }
}

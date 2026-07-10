import { google } from "googleapis";

export async function POST(req) {
  try {
    const { userId, subscriptionId } = await req.json();

    if (!userId || !subscriptionId) {
      return Response.json({ success: false, message: "Missing data" });
    }

    // Google Sheets Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // جلب كل الصفوف
    const read = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Users!A:Q", // العمود Q هو الأخير
    });

    const rows = read.data.values || [];

    // البحث عن المستخدم حسب userId
    const rowIndex = rows.findIndex((row) => row[0] === userId.toString());

    if (rowIndex === -1) {
      return Response.json({ success: false, message: "User not found" });
    }

    // كتابة الـ Subscription ID في العمود Q (index 16)
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
      message: "Subscription ID saved successfully",
    });

  } catch (err) {
    console.error(err);
    return Response.json({ success: false, message: "Server error" });
  }
}

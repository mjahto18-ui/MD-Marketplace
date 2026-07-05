import { google } from "googleapis";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, mobile, area, address } = body;

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const customersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!A2:Z",
    });

    const customers = customersRes.data.values || [];

    const exists = customers.find((row) => row[2] == mobile);

    if (exists) {
      return Response.json({
        success: false,
        message: "هذا الرقم مسجل مسبقاً… الرجاء انتظار التفعيل",
      });
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!A:Z",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            Date.now(),
            name,
            mobile,
            area,
            address,
            "",
            new Date().toLocaleDateString("en-US"),
            "Pending",
            5
          ],
        ],
      },
    });

    return Response.json({
      success: true,
      message: "تم التسجيل بنجاح… الرجاء انتظار التفعيل",
    });

  } catch (error) {
    console.error("Register API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

import { google } from "googleapis";

export async function POST(req) {
  try {
    const { mobile, pin } = await req.json();

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 1) فحص USERS لأنو هو اللي فيه PIN
    const usersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Users!A2:Z",
    });

    const users = usersRes.data.values || [];

    const user = users.find((row) => row[4] == mobile); // عمود الموبايل بUsers

    // إذا موجود بUsers → فحص PIN
    if (user) {
      const rowPin = user[10];   // PIN
      const rowStatus = user[9]; // Status

      if (rowStatus !== "Active") {
        return Response.json({
          success: false,
          message: "الحساب غير مفعل بعد",
        });
      }

      if (rowPin != pin) {
        return Response.json({
          success: false,
          message: "PIN غير صحيح",
        });
      }

      return Response.json({
        success: true,
        user: {
          id: user[0],
          name: user[3],
          mobile: user[4],
          role: user[2],
        },
      });
    }

    // 2) إذا الرقم غير موجود بUsers → ما نسجل جديد
    return Response.json({
      success: false,
      message: "الرقم غير موجود… الرجاء التسجيل أولاً",
    });

  } catch (error) {
    console.error("Login API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

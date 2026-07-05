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

    const user = users.find((row) => row[4] == mobile); // عمود الموبايل بجدول Users

    // إذا موجود بUsers → فحص PIN
    if (user) {
      const rowPin = user[10];   // عمود PIN
      const rowStatus = user[9]; // عمود Status

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

    // 2) إذا مش موجود بUsers → لازم يكون عميل جديد → نضيفه على Customers
    const customersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!A2:Z",
    });

    const customers = customersRes.data.values || [];

    const existsInCustomers = customers.find((row) => row[2] == mobile); // عمود الموبايل بCustomers

    // إذا موجود بCustomers → يعني Pending
    if (existsInCustomers) {
      return Response.json({
        success: false,
        message: "تم إرسال طلب التسجيل… الرجاء انتظار التفعيل",
      });
    }

    // 3) إذا مش موجود → إنشاء صف جديد بCustomers
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!A:Z",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            Date.now(),      // Customer ID
            "عميل جديد",     // Name
            mobile,          // Mobile
            "",              // Area
            "",              // Address
            "",              // Email
            new Date().toLocaleDateString("en-US"), // Join Date
            "Pending",       // Status
            10               // Free Delivery Remaining
          ],
        ],
      },
    });

    return Response.json({
      success: false,
      message: "تم إرسال طلب التسجيل… الرجاء انتظار التفعيل",
    });

  } catch (error) {
    console.error("Login API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

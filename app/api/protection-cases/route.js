import { NextResponse } from "next/server";
import { google } from "googleapis";

// 1) الاتصال مع Google Sheets
async function getSheet() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

// 2) قراءة آخر Case ID
async function getLastCaseID(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: "Protection Cases!A:A", // عمود Case ID
  });

  const rows = res.data.values || [];

  if (rows.length <= 1) {
    return "REF-000000"; // أول مرة
  }

  const last = rows[rows.length - 1][0]; // آخر قيمة
  return last;
}

// 3) توليد Case ID جديد
function generateCaseID(lastID) {
  const number = parseInt(lastID.replace("REF-", ""), 10) + 1;
  const padded = number.toString().padStart(6, "0");
  return `REF-${padded}`;
}

// 4) كتابة صف جديد
async function writeCase(sheets, data) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: "Protection Cases!A:Z",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [data],
    },
  });
}

// 5) الـ API الرئيسي
export async function POST(req) {
  try {
    const body = await req.json();

    const sheets = await getSheet();

    // قراءة آخر Case ID
    const lastID = await getLastCaseID(sheets);

    // توليد الجديد
    const caseID = generateCaseID(lastID);

    // تجهيز البيانات للكتابة
    const row = [
      caseID,                // Case ID
      body.orderId || "",    // Order ID (اختياري)
      body.customerId,       // Customer ID
      body.storeId || "",    // Store ID
      body.driverId || "",   // Driver ID
      body.caseType,         // Case Type
      body.description,      // Description
      body.photo1 || "",     // Photo 1
      body.photo2 || "",     // Photo 2
      body.photo3 || "",     // Photo 3
      "",                    // Video (مخفي)
      "Pending",             // Status
      "",                    // Decision
      "",                    // Refund Amount
      "",                    // Admin Note
      body.whatsapp || "",   // WhatsApp Chat
      new Date().toISOString(), // Created Date
      "",                    // Close Date
      "",                    // Responsible
    ];

    // كتابة الصف
    await writeCase(sheets, row);

    return NextResponse.json({
      success: true,
      caseID,
      message: "تم إرسال البلاغ بنجاح",
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message });
  }
}

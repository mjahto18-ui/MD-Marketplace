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
    range: "Protection Cases!A:A",
  });

  const rows = res.data.values || [];

  if (rows.length <= 1) {
    return "REF-000000";
  }

  const last = rows[rows.length - 1][0];
  return last;
}

// 3) توليد Case ID جديد
function generateCaseID(lastID) {
  const number = parseInt(lastID.replace("REF-", ""), 10) + 1;
  const padded = number.toString().padStart(6, "0");
  return `REF-${padded}`;
}

// 4) جلب اسم العميل من جدول Users
async function getCustomerName(sheets, phone) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: "Users!D:E", // E = Mobile, D = Name
  });

  const rows = res.data.values || [];

  for (let i = 1; i < rows.length; i++) {
    const [userPhone, userName] = rows[i];

    if (userPhone === phone) {
      return userName;
    }
  }

  return "زائر"; // إذا الرقم غير موجود
}

// 5) كتابة صف جديد
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

// 6) الـ API الرئيسي
export async function POST(req) {
  try {
    const body = await req.json();

    const sheets = await getSheet();

    const lastID = await getLastCaseID(sheets);

    const caseID = generateCaseID(lastID);

    // جلب اسم العميل أو "زائر"
    const customerName = await getCustomerName(sheets, body.customerId);

    const row = [
      caseID,
      body.orderId || "",
      customerName, // اسم العميل أو "زائر"
      body.storeId || "",
      body.driverId || "",
      body.caseType,
      body.description,
      "", // Photo 1 مخفية
      "", // Photo 2 مخفية
      "", // Photo 3 مخفية
      "",
      "Pending",
      "",
      "",
      "",
      body.whatsapp || "",
      new Date().toISOString(),
      "",
      "",
    ];

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

import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

// إعداد Google Drive عبر Service Account
const driveAuth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth: driveAuth });

// تحويل Base64 → Buffer
function base64ToBuffer(base64) {
  if (!base64) return null;
  const base64Data = base64.split(";base64,").pop();
  return Buffer.from(base64Data, "base64");
}

// رفع الصورة على Google Drive
async function uploadToDrive(base64, fileName) {
  if (!base64) return "";

  const buffer = base64ToBuffer(base64);

  const fileRes = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // مجلد الصور
    },
    media: {
      mimeType: "image/png",
      body: Readable.from(buffer), // الحل النهائي للخطأ pipe()
    },
  });

  const fileId = fileRes.data.id;

  // جعل الصورة Public
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  // رابط مباشر
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// الاتصال مع Google Sheets
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

// قراءة آخر Case ID
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

// توليد Case ID جديد
function generateCaseID(lastID) {
  const number = parseInt(lastID.replace("REF-", ""), 10) + 1;
  const padded = number.toString().padStart(6, "0");
  return `REF-${padded}`;
}

// كتابة صف جديد
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

// API الرئيسي
export async function POST(req) {
  try {
    const body = await req.json();

    const sheets = await getSheet();

    // قراءة آخر Case ID
    const lastID = await getLastCaseID(sheets);

    // توليد الجديد
    const caseID = generateCaseID(lastID);

    // رفع الصور على Google Drive
    const photo1Url = await uploadToDrive(body.photo1, `${caseID}-photo1.png`);
    const photo2Url = await uploadToDrive(body.photo2, `${caseID}-photo2.png`);
    const photo3Url = await uploadToDrive(body.photo3, `${caseID}-photo3.png`);

    // تجهيز البيانات للكتابة
    const row = [
      caseID,
      body.orderId || "",
      body.customerId,
      body.storeId || "",
      body.driverId || "",
      body.caseType,
      body.description,
      photo1Url, // رابط الصورة بدل Base64
      photo2Url,
      photo3Url,
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

import { NextResponse } from "next/server";
import { google } from "googleapis";

const APP_ID = process.env.APPSHEET_APP_ID;
const API_KEY = process.env.APPSHEET_API_KEY;

async function getSheet() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function getLastCaseID(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: "Protection Cases!A:A",
  });
  const rows = res.data.values || [];
  if (rows.length <= 1) return "REF-000000";
  return rows[rows.length - 1][0];
}

function generateCaseID(lastID) {
  const number = parseInt(lastID.replace("REF-", ""), 10) + 1;
  return `REF-${String(number).padStart(6, "0")}`;
}

// هاي ما لازم ننساها!
async function getCustomerName(sheets, phone) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: "Users!D:E",
  });
  const rows = res.data.values || [];
  const normalizedInput = phone?.toString().trim() || "";
  for (let i = 1; i < rows.length; i++) {
    const [userName, userPhoneRaw] = rows[i];
    if (!userPhoneRaw) continue;
    if (userPhoneRaw.toString().trim() === normalizedInput) return userName;
  }
  return "زائر";
}

export async function POST(req) {
  try {
    const body = await req.json();
    const sheets = await getSheet();

    const lastID = await getLastCaseID(sheets);
    const caseID = generateCaseID(lastID);
    const customerName = await getCustomerName(sheets, body.whatsapp);

    console.log("Creating case:", caseID, "for", customerName);

    // الكتابة عن طريق AppSheet مشان الصور
    const res = await fetch(`https://api.appsheet.com/api/v2/apps/${APP_ID}/tables/Protection Cases/Action`, {
      method: "POST",
      headers: {
        "ApplicationAccessKey": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Action: "Add",
        Properties: { Locale: "en-US" },
        Rows: [{
          "Case ID": caseID,
          "Order ID": body.orderId || "",
          "Customer ID": customerName, // هون من جدول Users
          "Store ID": body.storeId || "",
          "Driver ID": body.driverId || "",
          "Case Type": body.caseType || "",
          "Description": body.description || "",
          "Photo 1": body.photo1 || "",
          "Photo 2": body.photo2 || "",
          "Photo 3": body.photo3 || "",
          "Status": "Pending",
          "WhatsApp Chat": body.whatsapp || ""
        }]
      })
    });

    const text = await res.text();
    console.log("AppSheet:", res.status, text);
    if (!res.ok) throw new Error(text);

    return NextResponse.json({ success: true, caseID, message: "تم إرسال البلاغ بنجاح" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

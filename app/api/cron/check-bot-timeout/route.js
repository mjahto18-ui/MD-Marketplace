import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_API_KEY = process.env.APPSHEET_API_KEY;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1183824331491327";

function normalizeWhatsAppNumber(phone) {
  let clean = String(phone || "").replace(/\D/g, "");
  if (clean.startsWith("05")) clean = "966" + clean.substring(1);
  else if (clean.length === 9 && clean.startsWith("5")) clean = "966" + clean;
  else if (clean.startsWith("03")) clean = "9613" + clean.substring(2);
  else if (clean.length === 7 && clean.startsWith("3")) clean = "961" + clean;
  return clean;
}

async function appSheetAction(tableName, action, rows) {
  try {
    const res = await fetch(`https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${encodeURIComponent(tableName)}/Action`, {
      method: "POST",
      headers: { ApplicationAccessKey: APPSHEET_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ Action: action, Properties: { Locale: "en-US", TimeZone: "Asia/Beirut" }, Rows: rows })
    });
    const text = await res.text();
    console.log(`📡 Cron ${tableName}/${action}: ${res.status} ${text}`);
    return { ok: res.ok, text };
  } catch (e) { console.error(e); return null; }
}

async function sendMessage(to, text) {
  const cleanPhone = normalizeWhatsAppNumber(to);
  try {
    await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: cleanPhone, type: "text", text: { body: text } })
    });
  } catch (e) {}
}

async function getSheetRows(sheetName) {
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: process.env.GOOGLE_CLIENT_EMAIL, private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n") },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.GOOGLE_SHEETS_ID, range: `${sheetName}!A:AZ` });
  const rows = response.data.values || [];
  if (!rows.length) return [];
  const headers = rows[0].map(h => String(h || "").trim());
  return rows.slice(1).map(row => { const obj = {}; headers.forEach((header, index) => { obj[header] = row[index] || ""; }); return obj; });
}

async function clearCustomerCart(customerID) {
  if (!customerID) return;
  try {
    const { google } = await import("googleapis");
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: process.env.GOOGLE_CLIENT_EMAIL, private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n") },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = res.data.sheets.find(s => s.properties.title === "Cart");
    const sheetId = sheet.properties.sheetId;
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Cart!A:Z" });
    const rows = response.data.values || [];
    const rowsToDelete = [];
    for (let i = 1; i < rows.length; i++) {
      const rowCustomer = String(rows[i][1] || "").trim();
      const checkedOut = String(rows[i][6] || "FALSE").toUpperCase();
      if (rowCustomer === String(customerID).trim() && checkedOut !== "TRUE") rowsToDelete.push(i + 1);
    }
    if (!rowsToDelete.length) return;
    rowsToDelete.sort((a, b) => b - a);
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: rowsToDelete.map(rowNumber => ({ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: rowNumber - 1, endIndex: rowNumber } } })) } });
  } catch (e) { console.error("clearCart", e); }
}

export async function GET() {
  try {
    console.log("⏱ Cron: فحص جلسات BOT2 النائمة...");
    const sessions = await getSheetRows("Bot Sessions");
    const activeSessions = sessions.filter(s => String(s["Active Bot"] || "").trim() === "BOT2" && String(s["Status"] || "").toUpperCase() === "ACTIVE");
    
    let closedCount = 0;
    for (const session of activeSessions) {
      const lastActivityStr = session["Last Activity"] || "";
      if (!lastActivityStr) continue;
      const lastActivity = new Date(lastActivityStr);
      if (isNaN(lastActivity.getTime())) continue;
      const diffMinutes = (Date.now() - lastActivity.getTime()) / 1000 / 60;
      
      if (diffMinutes >= 30) {
        const phone = normalizeWhatsAppNumber(session["Phone"]);
        console.log(`⏰ تسكير تلقائي لـ ${phone} - ساكت ${diffMinutes.toFixed(1)} دقيقة`);
        
        const now = new Date().toISOString();
        await appSheetAction("Bot Sessions", "Edit", [{
          Phone: phone,
          "Active Bot": "BOT1",
          Status: "CLOSED",
          "Closed At": now,
          "Last Activity": now
        }]);

        // جيب customerId وامسح السلة
        const users = await getSheetRows("Users");
        const userRow = users.find(u => normalizeWhatsAppNumber(u["WhatsApp Number"] || u["Mobile"] || "") === phone);
        if (userRow?.["Customer ID"]) {
          await clearCustomerCart(userRow["Customer ID"]);
        }

        await sendMessage(phone, "⏰ انتهت جلسة الطلب بسبب عدم النشاط لمدة 30 دقيقة.\n\nتم إرجاعك للمساعد العام 😊 إذا بدك ترجع تطلب، اكتب *بدي طلب*");
        closedCount++;
      }
    }
    
    return NextResponse.json({ status: "ok", checked: activeSessions.length, closed: closedCount });
  } catch (e) {
    console.error("❌ Cron Error:", e);
    return NextResponse.json({ status: "error", message: e.message }, { status: 500 });
  }
}

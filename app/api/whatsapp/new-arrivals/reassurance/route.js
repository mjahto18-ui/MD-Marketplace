import { google } from "googleapis";
export const dynamic = "force-dynamic";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const CRON_SECRET = process.env.CRON_SECRET || "MDM_SECRET_123";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function normalize(phone) {
  let c = String(phone || "").replace(/\D/g, "");
  if (c.startsWith("05")) c = "966" + c.substring(1);
  else if (c.length === 9 && c.startsWith("5")) c = "966" + c;
  else if (c.startsWith("03")) c = "9613" + c.substring(2);
  else if (c.length === 7 && c.startsWith("3")) c = "961" + c;
  return c;
}

function getBeirutNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
}

async function getSheetRows(sheetName) {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  const values = res.data.values || [];
  const headers = values[0] || [];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

async function updateSheetRow(sheetName, keyCol, keyVal, updates) {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${sheetName}!A:Z` });
  const values = res.data.values;
  const headers = values[0];
  const keyIdx = headers.indexOf(keyCol);
  const rowIdx = values.findIndex((r, i) => i > 0 && r[keyIdx] == keyVal);
  if (rowIdx === -1) throw new Error(`Row ${keyVal} not found`);
  for (const [col, val] of Object.entries(updates)) {
    const colIdx = headers.indexOf(col);
    const letter = String.fromCharCode(65 + colIdx);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!${letter}${rowIdx + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[val]] }
    });
  }
}

async function sendMessage(to, text) {
  await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } })
  });
}

export async function GET(req) {
  const url = new URL(req.url);
  const authHeader = req.headers.get("authorization");
  const secretParam = url.searchParams.get("secret");
  if (authHeader!== `Bearer ${CRON_SECRET}` && secretParam!== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const messages = await getSheetRows("Messages");
    const users = await getSheetRows("Users");

    const nowBeirut = getBeirutNow();
    const lastMsg = {};
    for (let i = messages.length - 1; i >= 0; i--) {
      const row = messages[i];
      const phone = normalize(row["Phone"]);
      if (!phone) continue;
      if (lastMsg[phone]) continue;
      const cust = String(row["CustomerMessage"] || "").trim();
      if (!cust) continue;
      lastMsg[phone] = { phone, text: cust, date: new Date(row["Date"]), row };
    }

    let processed = 0;
    for (const phone in lastMsg) {
      const last = lastMsg[phone];
      if (String(last.row["Reassurance_Sent"] || "") === "YES") continue;
      const user = users.find(u => normalize(u["WhatsApp Number"]) === phone);
      if (!user) continue;
      const name = user["Name"];
      const finalMsg = `صباح الخير ${name} 🌸 حبيت تكوني أول العارفين، نزل عنا شي جديد بيجنن 😍 بتحبي تشوفيه؟`;
      await sendMessage(phone, finalMsg);
      await updateSheetRow("Messages", "Message ID", last.row["Message ID"], {
        "Reassurance_Sent": "YES",
        "Reassurance_At": nowBeirut.toLocaleString("en-US", { timeZone: "Asia/Beirut" })
      });
      processed++;
    }
    return new Response(JSON.stringify({ ok: true, processed }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Keepalive error:", e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

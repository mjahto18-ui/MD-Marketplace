import { google } from "googleapis";
export const dynamic = "force-dynamic";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const CRON_SECRET = process.env.CRON_SECRET || "MDM_SECRET_123";

function getAuth() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getSheetRows(sheetName) {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  const [headers,...rows] = res.data.values || [[], []];
  return rows.map(r => {
    const o = {};
    headers.forEach((h, i) => o[h.trim()] = r[i]);
    return o;
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

  for (const [col],[val] of Object.entries(updates)) {
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

function normalize(phone) {
  let c = String(phone || "").replace(/\D/g, "");
  if (c.startsWith("05")) c = "966" + c.substring(1);
  if (c.length === 9 && c.startsWith("5")) c = "966" + c;
  if (c.startsWith("03")) c = "9613" + c.substring(2);
  return c;
}
function getBeirutNow() { return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" })); }

async function sendMessage(to, text) {
  const res = await fetch(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
}

export async function GET(req) {
  const url = new URL(req.url);
  if (req.headers.get("authorization")!== `Bearer ${CRON_SECRET}` && url.searchParams.get("secret")!== CRON_SECRET)
    return new Response("Unauthorized", { status: 401 });

  const messages = await getSheetRows("messages");
  const users = await getSheetRows("users");
  const newArrivals = await getSheetRows("new_arrivals");

  const nowBeirut = getBeirutNow();
  const lastMsg = {};
  for (let i = messages.length - 1; i >= 0; i--) {
    const row = messages[i];
    const phone = normalize(row["Phone"]);
    if (!phone || lastMsg[phone] ||!String(row["CustomerMessage"] || "").trim()) continue;
    lastMsg[phone] = { phone, date: new Date(row["Date"]), row };
  }

  let processed = 0;
  for (const phone in lastMsg) {
    const last = lastMsg[phone];
    if (String(last.row["Reassurance_Sent"] || "") === "YES") continue;

    const user = users.find(u => normalize(u["WhatsApp Number"]) === phone);
    if (!user) continue;

    // هون كنت عامل allowed false دايماً - فتحتها للتجربة
    let allowed = true;

    const name = user["Name"];
    const isFemale = String(user["Gender"] || "").toLowerCase() === "female";
    const finalMsg = isFemale
     ? `صباح الخير ${name} 🌸 حبيت تكوني أول العارفين، نزل عنا شي جديد بيجنن 😍 بتحبي تشوفيه؟`
      : `صباح الخير ${name} 👋 حبيت تكون أول العارفين، نزل عنا شي جديد مرتب كتير، بتحب تشوفو؟`;

    await sendMessage(phone, finalMsg);
    await updateSheetRow("messages", "Message ID", last.row["Message ID"], {
      "Reassurance_Sent": "YES",
      "Reassurance_At": nowBeirut.toLocaleString("en-US", { timeZone: "Asia/Beirut" })
    });
    processed++;
  }
  return Response.json({ ok: true, processed, source: "GoogleSheet Direct" });
}

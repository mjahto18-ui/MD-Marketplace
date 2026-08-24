import { getgooglesheets } from "@/lib/googlesheets";

export const dynamic = "force-dynamic";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_API_KEY = process.env.APPSHEET_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET || "MDM_SECRET_123";

function normalize(phone) {
  let c = String(phone || "").replace(/\D/g, "");
  if (!c) return null;
  if (c.startsWith("05")) c = "966" + c.substring(1);
  else if (c.length === 9 && c.startsWith("5")) c = "966" + c;
  else if (c.startsWith("0")) c = "961" + c.substring(1);
  else if (c.length === 8) c = "961" + c;
  if (c.length < 11) return null;
  return c;
}

function getBeirutNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
}

async function getSheetRows(sheetName) {
  console.log(`📥 Reading ${sheetName}`);
  const sheets = await getgooglesheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEETS_ID, range: sheetName });
  const rows = res.data.values || [];
  if (rows.length < 2) return { headers: [], data: [] };
  const headers = rows[0];
  const data = rows.slice(1).map((r, idx) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = r[i] || ""));
    obj._rowIndex = idx + 2;
    return obj;
  });
  console.log(`📄 ${sheetName} -> ${data.length} rows`);
  return { headers, data };
}

async function updateSheetCell(sheetName, rowIndex, headerName, headers, value) {
  const colIndex = headers.indexOf(headerName);
  if (colIndex === -1) { console.log(`❌ Column ${headerName} مش موجودة بالشيت!`); return false; }
  const colLetter = String.fromCharCode(65 + colIndex);
  const col = colIndex >= 26? `${String.fromCharCode(64 + Math.floor(colIndex/26))}${String.fromCharCode(65 + colIndex%26)}` : colLetter;
  const range = `${sheetName}!${col}${rowIndex}`;
  console.log(`📝 GOOGLE SHEET WRITE ${range} = ${value}`);
  const sheets = await getgooglesheets();
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId: GOOGLE_SHEETS_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
  console.log(`✅ GOOGLE SHEET WRITE DONE ${range}`);
  return true;
}

async function appSheetAction(table, action, rows) {
  console.log(`📤 APPSHEET TRY ${table} ${action} rows=`, JSON.stringify(rows).slice(0,300));
  console.log(`APPSHEET ENV CHECK: hasAppId=${!!APPSHEET_APP_ID} hasKey=${!!APPSHEET_API_KEY}`);

  if (!APPSHEET_APP_ID ||!APPSHEET_API_KEY) {
    console.log(`❌ APPSHEET ENV MISSING!`);
    return "ENV MISSING";
  }

  const res = await fetch(`https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${table}/Action`, {
    method: "POST",
    headers: { "ApplicationAccessKey": APPSHEET_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ Action: action, Properties: { Locale: "en-US", Timezone: "Asia/Beirut" }, Rows: rows })
  });
  const txt = await res.text();
  console.log(`📬 APPSHEET RESULT ${table} ${action}: ${res.status} - ${txt}`);
  return txt;
}

async function sendMessage(to, text) {
  const clean = normalize(to);
  if (!clean) { console.log(`❌ رقم غلط ${to}`); return false; }
  console.log(`📤 SEND TRY to ${clean}`);
  const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: clean, type: "text", text: { body: String(text||"") } })
  });
  const txt = await res.text();
  console.log(`📬 WHATSAPP ${clean}: ${res.status} - ${txt}`);
  return res.ok;
}

export async function GET(req) {
  const url = new URL(req.url);
  if (url.searchParams.get("secret")!== CRON_SECRET && req.headers.get("authorization")!== `Bearer ${CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });

  try {
    console.log("--- CRON START ---");
    const { headers: msgHeaders, data: messages } = await getSheetRows("Messages");
    const { data: users } = await getSheetRows("Users");
    console.log(`Counts Messages=${messages.length} Users=${users.length}`);

    const nowBeirut = getBeirutNow();
    const lastMsg = {};
    for (let i = messages.length - 1; i >= 0; i--) {
      const row = messages[i];
      const phone = normalize(row["Phone"]);
      if (!phone) continue;
      if (lastMsg[phone]) continue;
      if (!String(row["CustomerMessage"]||"").trim()) continue;
      lastMsg[phone] = { phone, text: row["CustomerMessage"], date: new Date(row["Date"]), row };
    }
    console.log(`lastMsg unique=${Object.keys(lastMsg).length}`);

    let processed = 0;
    for (const phone in lastMsg) {
      const last = lastMsg[phone];
      console.log(`\n--- ${phone} Reassurance_Sent=[${last.row["Reassurance_Sent"]}] ---`);
      if (String(last.row["Reassurance_Sent"]||"") === "YES") { console.log("-> SKIP YES"); continue; }
      const user = users.find(u => normalize(u["WhatsApp Number"]) === phone);
      if (!user) { console.log("-> SKIP NO USER"); continue; }

      const name = user["Name"];
      const isFemale = String(user["Gender"]||"").toLowerCase() === "female";
      const finalMsg = isFemale? `صباح الخير ${name} 🌸 تيست` : `صباح الخير ${name} 👋 تيست`;

      await sendMessage(phone, finalMsg);

      // 1) اكتب بـ Google Sheet
      await updateSheetCell("Messages", last.row._rowIndex, "Reassurance_Sent", msgHeaders, "YES");
      await updateSheetCell("Messages", last.row._rowIndex, "Reassurance_At", msgHeaders, nowBeirut.toISOString());

      // 2) اكتب بـ AppSheet - هون كان العطل قبل!
      console.log(`--- WRITING TO APPSHEET for Message ID ${last.row["Message ID"]} ---`);
      await appSheetAction("Messages", "Edit", [{
        "Message ID": last.row["Message ID"],
        "Reassurance_Sent": "YES",
        "Reassurance_At": nowBeirut.toLocaleString("en-US", { timeZone: "Asia/Beirut" })
      }]);

      processed++;
    }

    console.log(`--- FINAL processed=${processed} ---`);
    return new Response(JSON.stringify({ ok: true, processed }), { status: 200 });
  } catch (e) {
    console.error("🔥 ERROR", e.stack);
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}

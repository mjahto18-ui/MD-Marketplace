import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);


function normalize(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function getField(row,...names) {
  if (!row) return "";
  const keys = Object.keys(row);
  for (const n of names) {
    if (row[n]!== undefined && row[n]!== null) return row[n];
    const f = keys.find(k => k.toLowerCase() === n.toLowerCase());
    if (f && row[f]!== undefined) return row[f];
  }
  return "";
}

async function getSheetRows(tableName) {
  const { data, error } = await supabase.from(tableName).select("*").order("supa_id", { ascending: true }).limit(50000);
  if (error) throw new Error(`Supabase ${tableName}: ${error.message}`);
  return data || [];
}

async function appSheetAction({ tableName, action, rows }) {
  const res = await fetch(
    `https://api.appsheet.com/api/v2/apps/${process.env.APPSHEET_APP_ID}/tables/${tableName}/Action`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ApplicationAccessKey": process.env.APPSHEET_ACCESS_KEY,
      },
      body: JSON.stringify({
        Action: action,
        Properties: { Locale: "en-US" },
        Rows: rows,
      }),
    }
  );
  const txt = await res.text();
  if (!res.ok) throw new Error(`AppSheet ${tableName}: ${txt}`);
  return txt;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret")!== process.env.REASSURANCE_SECRET) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }

    const messages = await getSheetRows("messages");
    const users = await getSheetRows("users");

    const lastMsg = {};
    for (let i = messages.length - 1; i >= 0; i--) {
      const row = messages[i];
      const phone = normalize(getField(row, "Phone"));
      if (!phone) continue;
      const cust = String(getField(row, "CustomerMessage") || "").trim();
      if (!cust) continue;
      if (!lastMsg[phone]) lastMsg[phone] = row;
    }

    const userMap = {};
    for (const u of users) {
      const w = normalize(getField(u, "WhatsApp Number"));
      if (w) userMap[w] = u;
    }

    let processed = 0;
    let checked = 0;

    for (const phone of Object.keys(lastMsg)) {
      const row = lastMsg[phone];
      const reass = String(getField(row, "Reassurance_Sent") || "").trim();
      if (reass) continue;

      const msgDate = new Date(getField(row, "Date") || Date.now());
      const hours = (Date.now() - msgDate.getTime()) / 3600000;
      if (hours < 4) continue;

      const user = userMap[phone];
      if (!user) continue;

      const waNum = getField(user, "WhatsApp Number");
      if (!waNum) continue;

      checked++;

      await appSheetAction({
        tableName: "Messages",
        action: "Edit",
        rows: [{ "supa_id": getField(row, "supa_id"), "Reassurance_Sent": "YES" }],
      });

      processed++;
      if (processed >= 5) break; // للتيست - بعت 5 بس
    }

    return new Response(JSON.stringify({ ok: true, total_messages: messages.length, unique_phones: Object.keys(lastMsg).length, checked, processed }), { status: 200 });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

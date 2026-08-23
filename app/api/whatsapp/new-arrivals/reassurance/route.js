import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
export async function GET(req) {
  try {
    const messages = await getSheetRows("Messages");
    const users = await getSheetRows("Users");

    const lastMsg = {};
    for (let i = messages.length - 1; i >= 0; i--) {
      const row = messages[i];
      const phone = normalize(row["Phone"] || "");
      if (!phone) continue;
      const cust = String(row["CustomerMessage"] || "").trim();
      if (!cust) continue;
      if (!lastMsg[phone]) lastMsg[phone] = { row, cust };
    }

    const debug = {
      total_messages: messages.length,
      total_users: users.length,
      unique_phones_in_lastMsg: Object.keys(lastMsg),
      check_9613177653: {
        in_lastMsg:!!lastMsg["9613177653"],
        row: lastMsg["9613177653"]?.row? {
          Phone: lastMsg["9613177653"].row["Phone"],
          CustomerMessage: lastMsg["9613177653"].row["CustomerMessage"]?.substring(0,20),
          Reassurance_Sent: lastMsg["9613177653"].row["Reassurance_Sent"],
          Date: lastMsg["9613177653"].row["Date"]
        } : null,
        user_found:!!users.find(u => normalize(u["WhatsApp Number"]) === "9613177653")
      }
    };

    return new Response(JSON.stringify(debug, null, 2), { status: 200 });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

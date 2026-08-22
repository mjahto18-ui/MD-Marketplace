import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function GET(req) {
  const logs = [];
  try {
    const { searchParams } = new URL(req.url);
    const tableParam = searchParams.get('table') || 'all';

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const allSheets = [
      "MD_Global_Control", "Messages", "Protection Cases", "Broadcast", "Webhook",
      "Push Queue", "Notification Templates", "GuestLogs", "Asceses", "Menu",
      "Personas", "Customers", "Users", "Drivers", "Areas", "Categories", "Stores",
      "Products", "Delivery Rates", "Rewards", "Reviews", "Wallet Transactions",
      "Driver Live tracking", "Cart", "Order Details", "Order Requuest",
      "Orders History", "Dashboard", "Custom Delivery", "Bot Sessions",
      "new_arrivals"
    ];

    let sheetsToSync = allSheets;
    if (tableParam!== 'all') {
      // بيدور على الاسم حتى لو small
      const found = allSheets.find(s => s.toLowerCase().replace(/\s+/g, '_') === tableParam.toLowerCase());
      sheetsToSync = found? [found] : [tableParam];
    }

    for (let idx = 0; idx < sheetsToSync.length; idx++) {
      const sheetName = sheetsToSync[idx];
      try {
        const tableName = sheetName.toLowerCase().replace(/\s+/g, '_');
        logs.push(`⏳ ${sheetName} -> ${tableName}...`);

        let res;
        let retries = 0;
        while (retries < 3) {
          try {
            res = await sheets.spreadsheets.values.get({
              spreadsheetId,
              range: `${sheetName}!A1:ZZ10000`,
            });
            break; // زبط
          } catch (err) {
            if (err.message.includes('Quota exceeded') && retries < 2) {
              logs.push(` ⏳ Quota، ناطر 15 ثانية...`);
              await sleep(15000);
              retries++;
            } else {
              throw err;
            }
          }
        }

        const rows = res.data.values;
        if (!rows || rows.length < 2) {
          logs.push(` ⚠ فاضي`);
        } else {
          const headers = rows[0].map(h => h.trim()).filter(Boolean);
          const data = rows.slice(1).map(row => {
            let obj = {};
            headers.forEach((h, i) => {
              let val = row[i] || null;
              if (val === '') val = null;
              obj[h] = val;
            });
            if (Object.values(obj).every(v =>!v)) return null;
            return obj;
          }).filter(Boolean);

          if (data.length === 0) {
            logs.push(` ⚠ بدون بيانات`);
          } else {
            await supabase.from(tableName).delete().neq('supa_id', 0);

            for (let i = 0; i < data.length; i += 500) {
              const chunk = data.slice(i, i + 500);
              const { error } = await supabase.from(tableName).insert(chunk);
              if (error) throw new Error(`${tableName}: ${error.message}`);
            }
            logs.push(` ✅ ${data.length} صف`);
          }
        }

      } catch (e) {
        logs.push(` ❌ ${sheetName}: ${e.message}`);
      }

      // نام ثانيتين بين كل جدول - إلا اذا جدول واحد بس
      if (sheetsToSync.length > 1 && idx < sheetsToSync.length - 1) {
        await sleep(2500);
      }
    }

    return Response.json({ ok: true, logs });

  } catch (e) {
    return Response.json({ ok: false, error: e.message, logs }, { status: 500 });
  }
}

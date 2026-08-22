import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 دقائق

export async function GET() {
  const logs = [];
  try {
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

    // كل الشيتات يلي عندك - مطابق للـ SQL يلي عملتو
    const allSheets = [
      "MD_Global_Control", "Messages", "Protection Cases", "Broadcast", "Webhook",
      "Push Queue", "Notification Templates", "GuestLogs", "Asceses", "Menu",
      "Personas", "Customers", "Users", "Drivers", "Areas", "Categories", "Stores",
      "Products", "Delivery Rates", "Rewards", "Reviews", "Wallet Transactions",
      "Driver Live tracking", "Cart", "Order Details", "Order Requuest",
      "Orders History", "Dashboard", "Custom Delivery", "Bot Sessions"
    ];

    for (const sheetName of allSheets) {
      try {
        const tableName = sheetName.toLowerCase().replace(/\s+/g, '_');
        logs.push(`⏳ ${sheetName} -> ${tableName}...`);

        const res = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A1:ZZ10000`,
        });

        const rows = res.data.values;
        if (!rows || rows.length < 2) {
          logs.push(`  ⚠️ فاضي`);
          continue;
        }

        const headers = rows[0].map(h => h.trim()).filter(Boolean);
        const data = rows.slice(1).map(row => {
          let obj = {};
          headers.forEach((h, i) => {
            let val = row[i] || null;
            if (val === '') val = null;
            obj[h] = val;
          });
          // لا تدخل صف فاضي كامل
          if (Object.values(obj).every(v => !v)) return null;
          return obj;
        }).filter(Boolean);

        if (data.length === 0) {
          logs.push(`  ⚠️ بدون بيانات`);
          continue;
        }

        // 1. امسح القديم
        await supabase.from(tableName).delete().neq('supa_id', 0);

        // 2. دخّل الجديد دفعات 500 صف
        for (let i = 0; i < data.length; i += 500) {
          const chunk = data.slice(i, i + 500);
          const { error } = await supabase.from(tableName).insert(chunk);
          if (error) throw new Error(`${tableName}: ${error.message}`);
        }

        logs.push(`  ✅ ${data.length} صف`);

      } catch (e) {
        logs.push(`  ❌ ${sheetName}: ${e.message}`);
      }
    }

    return Response.json({ ok: true, logs });

  } catch (e) {
    return Response.json({ ok: false, error: e.message, logs }, { status: 500 });
  }
}

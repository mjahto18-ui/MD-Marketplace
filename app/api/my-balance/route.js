export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function GET(req) {
  try {
    const customerID = req.nextUrl.searchParams.get("customerID");
    if (!customerID) return NextResponse.json({ success: true, points: 0, wallet: 0, total_spent: 0 });

    const supabase = getSupabase();
    const custIdLower = customerID.toString().trim().toLowerCase();

    // Rewards - Points Added - Points Used
    const { data: rewardsRows } = await supabase.from('rewards').select('*');
    let points = 0;
    (rewardsRows||[]).forEach(r => {
      const id = String(r['Customer ID'] || "").trim().toLowerCase();
      if(id === custIdLower) {
        const earned = Number(r['Points Added'] || 0);
        const redeemed = Number(r['Points Used'] || 0);
        points += earned - redeemed;
      }
    });

    // Wallet Transactions
    const { data: walletRows } = await supabase.from('wallet_transactions').select('*');
    let wallet = 0;
    (walletRows||[]).forEach((r) => {
      const id = String(r['Customer ID'] || "").trim().toLowerCase();
      const type = String(r['Type'] || "").trim().toLowerCase();
      const amount = Number(r['Amount'] || 0);

      if (id === custIdLower) {
        switch (type) {
          case "deduct":
            wallet -= amount;
            break;
          case "add":
          case "refund":
          case "points":
            wallet += amount;
            break;
          default:
            wallet += amount;
            break;
        }
      }
    });

    // Orders History - Total Spent
    const { data: historyRows } = await supabase.from('orders_history').select('*');
    let total_spent = 0;
    (historyRows||[]).forEach((r) => {
      const id = String(r['Costumer ID'] || "").trim().toLowerCase();
      if (id === custIdLower) {
        total_spent += Number(r['Total Amount'] || 0);
      }
    });

    return NextResponse.json({ success: true, points, wallet, total_spent });
  } catch (e) {
    return NextResponse.json({ success: true, points: 0, wallet: 0, total_spent: 0, error: e.message });
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';


function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
   // منع الكاش نهائياً
  return createClient(url, key, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' } as any)
    }
  });
}
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerID = searchParams.get("customerID");
    if (!customerID) return NextResponse.json({ success: true, points: 0, wallet: 0, total_spent: 0 });

    const supabase = getSupabase();
    const custIdLower = customerID.toString().trim().toLowerCase();

    // Rewards - Points Added - Points Used
    const { data: rewardsRows } = await supabase.from('rewards').select('*').limit(10000);
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
    const { data: walletRows } = await supabase.from('wallet_transactions').select('*').limit(10000);
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
    const { data: historyRows } = await supabase.from('orders_history').select('*').limit(10000);
    let total_spent = 0;
    (historyRows||[]).forEach((r) => {
      const id = String(r['Costumer ID'] || "").trim().toLowerCase();
      if (id === custIdLower) {
        total_spent += Number(r['Total Amount'] || 0);
      }
    });

    return NextResponse.json({ 
      success: true, 
      points, 
      wallet, 
      total_spent 
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (e: any) {
    return NextResponse.json({ success: true, points: 0, wallet: 0, total_spent: 0, error: e.message }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}

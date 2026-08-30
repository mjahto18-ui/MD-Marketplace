export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function GET(req) {
  try {
    const customerID = req.nextUrl.searchParams.get("customerID");
    if (!customerID) return NextResponse.json({ success: true, points: 0, wallet: 0 });

    const supabase = getSupabase();
    const custIdLower = customerID.toString().trim().toLowerCase();

    // Rewards - نفس المنطق: Earned - Redeemed
    const { data: rewardsRows } = await supabase.from('rewards').select('*');
    let points = 0;
    (rewardsRows||[]).forEach(r => {
      const id = String(r['Customer ID'] || r['customer_id'] || r[1] || "").trim().toLowerCase();
      if(id === custIdLower) {
        const earned = Number(r['Earned'] || r['earned'] || r['Points Earned'] || r[5] || 0);
        const redeemed = Number(r['Redeemed'] || r['redeemed'] || r['Points Redeemed'] || r[6] || 0);
        points += earned - redeemed;
      }
    });

    // Wallet Transactions - نفس المنطق
    const { data: walletRows } = await supabase.from('wallet_transactions').select('*');
    let wallet = 0;
    (walletRows||[]).forEach((r) => {
      const id = String(r['Customer ID'] || r['customer_id'] || r[1] || "").trim().toLowerCase();
      const type = String(r['Type'] || r['type'] || r[3] || "").trim().toLowerCase();
      const amount = Number(r['Amount'] || r['amount'] || r[4] || 0);

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

    return NextResponse.json({ success: true, points, wallet });
  } catch (e) {
    return NextResponse.json({ success: true, points: 0, wallet: 0, error: e.message });
  }
}

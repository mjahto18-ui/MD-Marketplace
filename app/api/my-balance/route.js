import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) }
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customerID = searchParams.get("customerID");
    if (!customerID) return NextResponse.json({ success: true, points: 0, wallet: 0, total_spent: 0 });

    const supabase = getSupabase();
    const custId = customerID.toString().trim();
    const custIdLower = custId.toLowerCase();

    // 1- جيب الـ User ID - eq بدل ilike - أسرع وبيستعمل Index
    const { data: userRow } = await supabase.from('users')
      .select('"User ID"')
      .eq('"Customer ID"', custId)
      .maybeSingle();
    
    const ownerUserId = userRow?.["User ID"] || null;

    // 2- بس لهالزبون - مش كل الجدول! - 3 ضربات مع بعض
    const [rewardsRes, walletRes, historyRes] = await Promise.all([
      supabase.from('rewards')
        .select('"Points Added", "Points Used"')
        .eq('"Customer ID"', custId)
        .limit(1000),

      ownerUserId 
        ? supabase.from('wallet_transactions')
            .select('"Amount", "Type", "Reason", "Owner Role", "Customer ID"')
            .eq('"Owner User ID"', ownerUserId)
            .limit(2000)
        : supabase.from('wallet_transactions')
            .select('"Amount", "Type", "Reason", "Owner Role", "Customer ID"')
            .eq('"Customer ID"', custId)
            .limit(2000),

      supabase.from('orders_history')
        .select('"Total Amount"')
        .eq('"Costumer ID"', custId)
        .limit(2000)
    ]);

    // 3- نفس حسابك القديم - بس على 100 row مش مليون
    let points = 0;
    (rewardsRes.data || []).forEach(r => {
      points += Number(r['Points Added'] || 0) - Number(r['Points Used'] || 0);
    });

    let wallet = 0;
    (walletRes.data || []).forEach(r => {
      const isCustomerRow = String(r["Owner Role"]||"").toLowerCase() === 'customer' || 
                           String(r["Customer ID"]||"").toLowerCase() === custIdLower;
      if (!isCustomerRow) return;
      const amount = Number(r['Amount'] || 0);
      const type = String(r['Type'] || "").toUpperCase();
      const reason = String(r['Reason'] || "").toUpperCase();
      
      if (type === 'DEDUCT' || reason === 'CASH_PAYOUT' || reason === 'TAXI_FEE') {
        wallet -= amount;
      } else {
        wallet += amount;
      }
    });

    let total_spent = 0;
    (historyRes.data || []).forEach(r => {
      total_spent += Number(r['Total Amount'] || 0);
    });

    // بلا كاش - متل ما بدك - no-store
    return NextResponse.json({ success: true, points, wallet, total_spent }, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (e) {
    return NextResponse.json({ success: true, points: 0, wallet: 0, total_spent: 0, error: e.message }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}

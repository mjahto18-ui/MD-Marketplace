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

    // 1- جيب User ID
    const { data: userRow } = await supabase.from('users')
      .select('"User ID"')
      .eq('Customer ID', custId)
      .maybeSingle();
    
    const ownerUserId = userRow?.["User ID"] || null;

    // 2- 3 ضربات - بس كل وحدة بتجيب سطر واحد أو sum من الداتا بيز
    const [rewardsRes, walletRes, historyRes] = await Promise.all([
      // نقاط - خليها جمع متل ما هي
      supabase.from('rewards')
        .select('"Points Added", "Points Used"')
        .eq('Customer ID', custId)
        .limit(1000),

      // والت - أهم شي - جيب Balance After من آخر سطر بس - مش جمع 2000 سطر
      ownerUserId 
        ? supabase.from('wallet_transactions')
            .select('"Balance After"')
            .eq('Owner User ID', ownerUserId)
            .order('Created At', { ascending: false })
            .order('supa_id', { ascending: false })
            .limit(1)
            .maybeSingle()
        : supabase.from('wallet_transactions')
            .select('"Balance After"')
            .eq('Owner User ID', custId) // fallback اذا ما لقى User ID
            .order('Created At', { ascending: false })
            .limit(1)
            .maybeSingle(),

      supabase.from('orders_history')
        .select('"Total Amount"')
        .eq('Costumer ID', custId)
        .limit(2000)
    ]);

    let points = 0;
    (rewardsRes.data || []).forEach(r => {
      points += Number(r['Points Added'] || 0) - Number(r['Points Used'] || 0);
    });

    // والت هلق سطر واحد بس - حتى لو 5000 حركة
    const wallet = Number(walletRes.data?.["Balance After"] || 0);

    let total_spent = 0;
    (historyRes.data || []).forEach(r => {
      total_spent += Number(r['Total Amount'] || 0);
    });

    return NextResponse.json({ success: true, points, wallet, total_spent }, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (e) {
    console.error('CUSTOMER WALLET ERROR:', e.message);
    return NextResponse.json({ success: true, points: 0, wallet: 0, total_spent: 0, error: e.message }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}

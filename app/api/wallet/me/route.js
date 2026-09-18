import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key, { 
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) } 
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json({ success: false, wallet: 0, transactions: [], error: "userId required" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('"Owner User ID"', userId)
      .order('"Created At"', { ascending: false });

    if (error) throw error;

    let wallet = 0;
    (data || []).forEach(r => {
      const amt = Number(r.Amount || 0);
      const type = String(r.Type || "").toUpperCase();
      // DEDUCT و CASH_OUT بينخصمو، الباقي كلو بيزيد
      if (type === 'DEDUCT' || type === 'CASH_OUT') {
        wallet -= amt;
      } else {
        wallet += amt;
      }
    });

    return NextResponse.json({ 
      success: true, 
      wallet, 
      transactions: data || [] 
    }, { headers: { 'Cache-Control': 'no-store' } });

  } catch (e) {
    return NextResponse.json({ success: false, wallet: 0, transactions: [], error: e.message }, { status: 500 });
  }
}

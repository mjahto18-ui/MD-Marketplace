import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url ||!key) throw new Error("Missing env");
  return createClient(url, key, {
    global: { fetch: (input, init) => fetch(input, {...init, cache: 'no-store' }) }
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

    // جيب 21 سطر - أول واحد هو الرصيد، الباقي للعرض
    const { data, error } = await supabase
     .from('wallet_transactions')
     .select('"Transaction ID", "Type", "Reason", "Amount", "Balance After", "Created At", "Notes", "Transfer ID"')
     .eq('"Owner User ID"', userId)
     .order('"Created At"', { ascending: false })
     .limit(21);

    if (error) throw error;

    const wallet = Number(data?.[0]?.["Balance After"] || 0);

    return NextResponse.json({
      success: true,
      wallet,
      transactions: data || []
    }, { headers: { 'Cache-Control': 'no-store' } });

  } catch (e) {
    return NextResponse.json({ success: false, wallet: 0, transactions: [], error: e.message }, { status: 500 });
  }
}

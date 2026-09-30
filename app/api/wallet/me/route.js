import { NextResponse } from "next/server";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json(
        { success: false, wallet: 0, transactions: [], error: "userId required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('"Owner User ID"', userId)
    .order('"Created At"', { ascending: false })
    .limit(100);

    if (error) throw error;

    // الرصيد = Balance After من أول سطر (آخر سطر بالترتيب)
    const wallet = Number(data?.[0]?.["Balance After"]?? 0);

    return NextResponse.json(
      {
        success: true,
        wallet,
        transactions: data || []
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    return NextResponse.json(
      { success: false, wallet: 0, transactions: [], error: e.message },
      { status: 500 }
    );
  }
}

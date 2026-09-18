import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
export const dynamic = "force-dynamic";

function getSupabase(){
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

export async function POST(req){
  try{
    const { ownerId, amount, method, notes, createdBy } = await req.json();
    if(!ownerId || !amount) return NextResponse.json({success:false, error:'ناقص'}, {status:400});
    const supabase = getSupabase();
    const amt = Number(amount);
    const transferId = crypto.randomUUID();
    const payoutId = crypto.randomUUID();

    const { data: u } = await supabase.from('users').select('Role, Name').eq('User ID', ownerId).maybeSingle();

    // 1- سحب من المحفظة
    await supabase.from('wallet_transactions').insert({
      "Transaction ID": crypto.randomUUID(),
      "Owner User ID": ownerId,
      "Owner Role": u?.Role || 'Driver',
      "Type": "CASH_OUT",
      "Reason": "CASH_PAYOUT",
      "Amount": amt,
      "Notes": notes || 'سحب كاش',
      "Transfer ID": transferId,
      "Related Payout ID": payoutId,
      "Triggered By": createdBy || 'Admin'
    });

    // 2- كب ع جدول الكاش
    const { error } = await supabase.from('cash_payouts').insert({
      "Payout ID": payoutId,
      "Owner User ID": ownerId,
      "Owner Role": u?.Role || 'Driver',
      "Owner Name": u?.Name || '',
      "Amount": amt,
      "Method": method || 'Cash',
      "Status": 'Completed',
      "Notes": notes || 'سحب كاش',
      "Related Transfer ID": transferId,
      "Created By": createdBy || 'Admin'
    });
    if(error) throw error;

    return NextResponse.json({success:true, payoutId, transferId});
  }catch(e){
    return NextResponse.json({success:false, error:e.message}, {status:500});
  }
}

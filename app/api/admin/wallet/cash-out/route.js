import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
export const dynamic = "force-dynamic";

function getSupabase(){
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(req){
  // === حماية Admin/Accounting فقط ===
  try{
    const cookieStore = await cookies();
    const sessionRaw = cookieStore.get('admin_session')?.value;
    if(!sessionRaw) return NextResponse.json({success:false, error:'Unauthorized'}, {status:401});
    const session = JSON.parse(sessionRaw);
    const role = String(session.role || session.Role || "").trim();
    if(!['Admin','Accounting'].includes(role)){
      return NextResponse.json({success:false, error:'Forbidden - بس ادمن/محاسب'}, {status:403});
    }
  }catch(e){
    return NextResponse.json({success:false, error:'Invalid session'}, {status:401});
  }

  try{
    const { ownerId, amount, method, notes, createdBy } = await req.json();
    if(!ownerId || !amount) return NextResponse.json({success:false, error:'ناقص - ownerId و amount'}, {status:400});
    
    const supabase = getSupabase();
    const amt = Number(String(amount).replace(/,/g,''));
    if(isNaN(amt) || amt <= 0) return NextResponse.json({success:false, error:'مبلغ غلط'}, {status:400});

    const transferId = crypto.randomUUID();
    const payoutId = crypto.randomUUID();

    const { data: u } = await supabase.from('users').select('Role, Name').eq('User ID', ownerId).maybeSingle();

    // 1- سحب من المحفظة - DEDUCT مش CASH_OUT
    const { error: walletError } = await supabase.from('wallet_transactions').insert({
      "Transaction ID": crypto.randomUUID(),
      "Transfer ID": transferId,
      "Owner User ID": ownerId,
      "Owner Role": u?.Role || 'Store Owner',
      "Type": "DEDUCT",
      "Reason": "CASH_PAYOUT",
      "Amount": amt,
      "Notes": notes || 'سحب كاش تسليم يد',
      "Order ID": null
    });
    if(walletError) throw new Error('wallet_transactions: ' + walletError.message);

    // 2- كب ع جدول الكاش
    const { error: cashError } = await supabase.from('cash_payouts').insert({
      "Payout ID": payoutId,
      "Owner User ID": ownerId,
      "Owner Role": u?.Role || 'Store Owner',
      "Owner Name": u?.Name || '',
      "Amount": amt,
      "Method": method || 'Cash',
      "Status": 'Completed',
      "Notes": notes || 'سحب كاش تسليم يد',
      "Related Transfer ID": transferId,
      "Created By": createdBy || 'Admin'
    });
    if(cashError) throw new Error('cash_payouts: ' + cashError.message);

    // 3- جيب الرصيد الجديد مشان الواجهة
    const { data: txs } = await supabase.from('wallet_transactions').select('Type, Amount').eq('Owner User ID', ownerId);
    let newBalance = 0;
    if(txs){
      txs.forEach(t => {
        const type = String(t.Type).toUpperCase();
        if(type === 'ADD' || type === 'BONUS') newBalance += Number(t.Amount);
        else if(type === 'DEDUCT') newBalance -= Number(t.Amount);
      });
    }

    return NextResponse.json({success:true, payoutId, transferId, newBalance});
  }catch(e){
    console.error('cash-out error:', e);
    return NextResponse.json({success:false, error:e.message}, {status:500});
  }
}

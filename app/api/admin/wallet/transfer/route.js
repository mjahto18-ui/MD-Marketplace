import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
export const dynamic = "force-dynamic";

function getSupabase(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  return createClient(url, key);
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
    const { fromUserId, toUserId, amount, reason, notes, orderId, triggeredBy } = await req.json();
    if(!fromUserId || !toUserId || !amount) return NextResponse.json({success:false, error:'ناقص'}, {status:400});
    
    const supabase = getSupabase();
    const amt = Number(amount);
    const transferId = crypto.randomUUID();

    // جيب رولات
    const { data: fromU } = await supabase.from('users').select('Role, Name').eq('User ID', fromUserId).maybeSingle();
    const { data: toU } = await supabase.from('users').select('Role, Name').eq('User ID', toUserId).maybeSingle();

    const txs = [
      {
        "Owner User ID": fromUserId,
        "Owner Role": fromU?.Role || 'Admin',
        "Counterparty User ID": toUserId,
        "Type": "DEDUCT",
        "Reason": reason || 'TRANSFER_TO_STORE',
        "Amount": amt,
        "Order ID": orderId || null,
        "Notes": notes || `تحويل الى ${toUserId}`,
        "Triggered By": triggeredBy || fromUserId,
        "Transfer ID": transferId
      },
      {
        "Owner User ID": toUserId,
        "Owner Role": toU?.Role || 'Driver',
        "Counterparty User ID": fromUserId,
        "Type": "ADD",
        "Reason": reason || 'ORDER_COMPLETED',
        "Amount": amt,
        "Order ID": orderId || null,
        "Notes": notes || `تحويل من ${fromUserId}`,
        "Triggered By": triggeredBy || fromUserId,
        "Transfer ID": transferId
      }
    ];

    const { error } = await supabase.from('wallet_transactions').insert(txs);
    if(error) throw error;
    return NextResponse.json({success:true, transferId});
  }catch(e){
    return NextResponse.json({success:false, error:e.message}, {status:500});
  }
}

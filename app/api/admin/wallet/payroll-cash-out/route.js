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

// ===== GET: بحث برقم التلفون - يرجع الاسم واليوزر ايدي والرصيد =====
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone')?.trim();
    if(!phone) return NextResponse.json({success:false, error:'phone required'}, {status:400});

    const supabase = getSupabase();
    const cleanPhone = phone.replace(/\s/g,'');

    // دور بـ users
    const { data: users } = await supabase.from('users').select('"User ID", "Name", "Role", "Mobile"').ilike('Mobile', `%${cleanPhone}%`).limit(10);
    
    if(users && users.length > 0){
      // جيب الرصيد لكل واحد
      const enriched = await Promise.all(users.map(async (u)=>{
        const { data: txs } = await supabase.from('wallet_transactions').select('Type, Amount').eq('Owner User ID', u['User ID']);
        let bal = 0;
        (txs||[]).forEach(t=>{
          const type = String(t.Type).toUpperCase();
          if(type === 'DEDUCT' || type === 'CASH_OUT') bal -= Number(t.Amount||0);
          else bal += Number(t.Amount||0);
        });
        return { userId: u['User ID'], name: u.Name||'', role: u.Role||'', mobile: u.Mobile||'', balance: bal };
      }));
      return NextResponse.json({success:true, users: enriched});
    }

    // fallback: customers
    const { data: customers } = await supabase.from('customers').select('"Customer ID", "Mobile", "Name"').ilike('Mobile', `%${cleanPhone}%`).limit(10);
    if(customers && customers.length > 0){
      const enriched = await Promise.all(customers.map(async (c)=>{
        const { data: u } = await supabase.from('users').select('"User ID"').ilike('"Customer ID"', `%${c['Customer ID']}%`).maybeSingle();
        const ownerId = u?.['User ID'] || c['Customer ID'];
        const { data: txs } = await supabase.from('wallet_transactions').select('Type, Amount').eq('Owner User ID', ownerId);
        let bal = 0;
        (txs||[]).forEach(t=>{
          const type = String(t.Type).toUpperCase();
          if(type === 'DEDUCT' || type === 'CASH_OUT') bal -= Number(t.Amount||0);
          else bal += Number(t.Amount||0);
        });
        return { userId: ownerId, name: c.Name||'', role: 'Customer', mobile: c.Mobile||'', balance: bal };
      }));
      return NextResponse.json({success:true, users: enriched});
    }

    return NextResponse.json({success:false, error:'ما لقينا حدا بهاد الرقم'}, {status:404});
  }catch(e){
    return NextResponse.json({success:false, error:e.message}, {status:500});
  }
}

// ===== POST: دفع راتب كاش بعد التحقق من الكود 5 أرقام + فحص الرصيد =====
export async function POST(req){
  // حماية Admin/Accounting
  let adminId = 'Admin';
  try{
    const cookieStore = await cookies();
    const sessionRaw = cookieStore.get('admin_session')?.value;
    if(!sessionRaw) return NextResponse.json({success:false, error:'Unauthorized'}, {status:401});
    const session = JSON.parse(sessionRaw);
    const role = String(session.role || session.Role || "").trim();
    if(!['Admin','Accounting','Assistant Admin'].includes(role)){
      return NextResponse.json({success:false, error:'Forbidden - بس ادمن/محاسب'}, {status:403});
    }
    adminId = session.userId || session.id || 'Admin';
  }catch(e){
    return NextResponse.json({success:false, error:'Invalid session'}, {status:401});
  }

  try{
    const { phone, code, amount, createdBy } = await req.json();
    if(!phone || !code || !amount) return NextResponse.json({success:false, error:'ناقص - phone, code, amount'}, {status:400});

    const supabase = getSupabase();
    const cleanPhone = String(phone).replace(/\s/g,'').trim();
    const cleanCode = String(code).trim();
    const amt = Number(String(amount).replace(/,/g,''));
    const who = createdBy || adminId;

    if(isNaN(amt) || amt <= 0) return NextResponse.json({success:false, error:'مبلغ غلط'}, {status:400});
    if(cleanCode.length !== 5) return NextResponse.json({success:false, error:'الكود لازم 5 أرقام'}, {status:400});

    // 1- لاقي اليوزر بالتلفون
    let ownerUserId = null;
    let ownerName = '';
    let ownerRoleRaw = '';

    const { data: usersByPhone } = await supabase.from('users').select('"User ID", "Name", "Role", "Mobile"').ilike('Mobile', `%${cleanPhone}%`).limit(5);
    let matchedUser = null;
    if(usersByPhone && usersByPhone.length > 0){
      matchedUser = usersByPhone.find(u => String(u.Mobile||'').replace(/\s/g,'').includes(cleanPhone)) || usersByPhone[0];
    }

    if(!matchedUser){
      return NextResponse.json({success:false, error:`ما لقينا موظف برقم ${cleanPhone}`}, {status:404});
    }

    ownerUserId = matchedUser['User ID'];
    ownerName = matchedUser.Name || '';
    ownerRoleRaw = matchedUser.Role || 'Driver';

    // 2- لاقي الموظف من employees عبر user_id
    const { data: emp, error: empErr } = await supabase.from('employees').select('id, full_name, user_id').eq('user_id', ownerUserId).maybeSingle();
    if(empErr) throw empErr;
    if(!emp){
      return NextResponse.json({success:false, error:`اليوزر ${ownerName} (${ownerUserId.slice(0,8)}) ما عندو سجل بجدول employees`}, {status:400});
    }

    // 3- المطابقة: payroll_runs لنفس الموظف + نفس الكود + مش مقبوض
    const { data: payrollRows, error: payrollErr } = await supabase
      .from('payroll_runs')
      .select('id, employee_id, amount, secret_code_5, status, month_year')
      .eq('employee_id', emp.id)
      .eq('secret_code_5', cleanCode)
      .neq('status', 'claimed')
      .order('created_at', {ascending:false});

    if(payrollErr) throw payrollErr;
    if(!payrollRows || payrollRows.length === 0){
      // جرب يشوف إذا الكود موجود بس claimed
      const { data: claimedCheck } = await supabase.from('payroll_runs').select('id, status, month_year').eq('employee_id', emp.id).eq('secret_code_5', cleanCode).maybeSingle();
      if(claimedCheck?.status === 'claimed'){
        return NextResponse.json({success:false, error:`هاد الكود مقبوض سابقاً - شهر ${claimedCheck.month_year}`}, {status:400});
      }
      return NextResponse.json({success:false, error:`الكود ${cleanCode} غير صحيح للموظف ${ownerName}`}, {status:400});
    }

    const matchedPayroll = payrollRows[0]; // أحدث واحد

    // 4- فحص الرصيد قبل الدفع
    const { data: txs } = await supabase.from('wallet_transactions').select('Type, Amount').eq('Owner User ID', ownerUserId);
    let currentBalance = 0;
    (txs||[]).forEach(t=>{
      const type = String(t.Type).toUpperCase();
      if(type === 'DEDUCT' || type === 'CASH_OUT') currentBalance -= Number(t.Amount||0);
      else currentBalance += Number(t.Amount||0);
    });

    // إذا الراتب لسه pending، الترigger رح يضيف المبلغ للمحفظة عند تحويله لـ in_wallet
    // فالرصيد المتوقع = الحالي + مبلغ الراتب إذا كان pending
    let projectedBalance = currentBalance;
    if(matchedPayroll.status === 'pending'){
      projectedBalance += Number(matchedPayroll.amount||0);
    }

    if(amt > projectedBalance){
      return NextResponse.json({
        success:false, 
        error:`رصيد غير كافي - رصيده الحالي ${currentBalance.toLocaleString()}، بعد تنزيل الراتب بيصير ${projectedBalance.toLocaleString()}، والمطلوب ${amt.toLocaleString()}`
      }, {status:400});
    }

    // إذا الدفع جزئي، تأكد ما يتجاوز مبلغ الراتب
    if(amt > Number(matchedPayroll.amount||0)){
      return NextResponse.json({
        success:false,
        error:`المبلغ المطلوب ${amt.toLocaleString()} أكبر من قيمة الراتب ${Number(matchedPayroll.amount).toLocaleString()}`
      }, {status:400});
    }

    // 5- إذا الراتب pending، حوله لـ in_wallet أول (التريغر رح ينزل المصاري ع المحفظة)
    if(matchedPayroll.status === 'pending'){
      const { error: toWalletErr } = await supabase.from('payroll_runs').update({ status: 'in_wallet' }).eq('id', matchedPayroll.id).eq('status', 'pending');
      if(toWalletErr) throw toWalletErr;
      // انتظر شوي للتريغر
      await new Promise(r=>setTimeout(r, 500));
    }

    // 6- نفذ الدفع: خصم + cash_payouts
    const transferId = crypto.randomUUID();
    const payoutId = crypto.randomUUID();

    // تحديد Owner Role يتوافق مع constraint تاع cash_payouts
    let cashRole = 'Driver';
    const allowedCashRoles = ['Store Owner','Driver','Taxi','Customer','Admin'];
    if(allowedCashRoles.includes(ownerRoleRaw)) cashRole = ownerRoleRaw;
    else if(['Admin','Assistant Admin','Accounting'].includes(ownerRoleRaw)) cashRole = 'Admin';
    else cashRole = 'Driver';

    let walletOwnerRole = ownerRoleRaw;
    const allowedWalletRoles = ['Admin','Store Owner','Driver','Taxi','Customer'];
    if(!allowedWalletRoles.includes(walletOwnerRole)){
      walletOwnerRole = 'Driver';
    }

    const { error: walletError } = await supabase.from('wallet_transactions').insert({
      "Transaction ID": crypto.randomUUID(),
      "Transfer ID": transferId,
      "Owner User ID": ownerUserId,
      "Owner Role": walletOwnerRole,
      "Type": "DEDUCT",
      "Reason": "CASH_PAYOUT",
      "Amount": amt,
      "Notes": `SALARY CASH - ${matchedPayroll.month_year} - Code ${cleanCode} - Payroll ${matchedPayroll.id} - by ${who}`,
      "Order ID": null,
      "Triggered By": who
    });
    if(walletError) throw new Error('wallet_transactions: ' + walletError.message);

    const { error: cashError } = await supabase.from('cash_payouts').insert({
      "Payout ID": payoutId,
      "Owner User ID": ownerUserId,
      "Owner Role": cashRole,
      "Owner Name": ownerName || emp.full_name,
      "Amount": amt,
      "Method": "Cash",
      "Status": "Completed",
      "Notes": `SALARY ${matchedPayroll.month_year} - Code ${cleanCode} - Payroll ${matchedPayroll.id} - Partial ${amt}/${matchedPayroll.amount}`,
      "Related Transfer ID": transferId,
      "Created By": who
    });
    if(cashError) throw new Error('cash_payouts: ' + cashError.message);

    // 7- إذا الدفع كامل أو أكثر، علمه claimed، إذا جزئي خليه in_wallet
    if(amt >= Number(matchedPayroll.amount||0)){
      await supabase.from('payroll_runs').update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        claimed_by: who
      }).eq('id', matchedPayroll.id);
    }

    // جيب الرصيد الجديد
    const { data: txs2 } = await supabase.from('wallet_transactions').select('Type, Amount').eq('Owner User ID', ownerUserId);
    let newBalance = 0;
    (txs2||[]).forEach(t=>{
      const type = String(t.Type).toUpperCase();
      if(type === 'DEDUCT' || type === 'CASH_OUT') newBalance -= Number(t.Amount||0);
      else newBalance += Number(t.Amount||0);
    });

    return NextResponse.json({
      success:true, 
      payoutId, 
      transferId, 
      payrollId: matchedPayroll.id,
      month: matchedPayroll.month_year,
      employee: ownerName || emp.full_name,
      amount: amt,
      payrollAmount: matchedPayroll.amount,
      isPartial: amt < Number(matchedPayroll.amount||0),
      newBalance,
      currentBalanceBefore: currentBalance,
      message: amt >= Number(matchedPayroll.amount||0) 
        ? `تم دفع كامل الراتب ${amt.toLocaleString()} ل.ل كاش لـ ${ownerName||emp.full_name}`
        : `تم دفع جزئي ${amt.toLocaleString()} من أصل ${Number(matchedPayroll.amount).toLocaleString()} لـ ${ownerName||emp.full_name}`
    });

  }catch(e){
    console.error('payroll-cash-out error:', e);
    return NextResponse.json({success:false, error:e.message}, {status:500});
  }
}

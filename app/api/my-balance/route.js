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
    const custIdLower = customerID.toString().trim().toLowerCase();

    // نقاط - بقي متل ما هو
    const { data: rewardsRows } = await supabase.from('rewards').select('*');
    let points = 0;
    (rewardsRows||[]).forEach(r => {
      const id = String(r['Customer ID'] || "").trim().toLowerCase();
      if(id === custIdLower) {
        points += Number(r['Points Added'] || 0) - Number(r['Points Used'] || 0);
      }
    });

    // هون التزبيط للجدول الجديد
    // 1- جيب الـ User ID من الـ Customer ID
    const { data: userRow } = await supabase.from('users').select('"User ID","Customer ID"').ilike('"Customer ID"', customerID).maybeSingle();
    const ownerUserId = userRow?.["User ID"] || null;

    // 2- جيب المحفظة - بالـ Owner User ID الجديد + الـ Customer ID القديم للتوافق
    let walletQuery = supabase.from('wallet_transactions').select('*');
    if (ownerUserId) {
      walletQuery = walletQuery.or(`"Owner User ID".eq.${ownerUserId},"Customer ID".ilike.${customerID}`);
    } else {
      walletQuery = walletQuery.ilike('"Customer ID"', customerID);
    }
    const { data: walletRows } = await walletQuery;

    let wallet = 0;
    (walletRows||[]).forEach((r) => {
      const amount = Number(r['Amount'] || 0); // هلق صار NUMERIC
      const type = String(r['Type'] || "").toUpperCase();
      const reason = String(r['Reason'] || "").toUpperCase();

      // كل شي DEDUCT او CASH_OUT او TAXI_FEE بينخصم
      if (type === 'DEDUCT' || type === 'CASH_OUT' || reason === 'CASH_PAYOUT' || reason === 'TAXI_FEE' || reason === 'TRANSFER_TO_STORE') {
        // TRANSFER_TO_STORE هو خصم من عند الادمن بس، مش من الزبون، فما منحسبو للزبون
        if (r["Owner Role"] === 'Customer' || String(r["Customer ID"]||"").toLowerCase() === custIdLower) {
           if (reason !== 'TRANSFER_TO_STORE' && reason !== 'ORDER_FULL_IN') {
             // بس الخصم الحقيقي للزبون
             if (type === 'DEDUCT' || reason === 'CASH_PAYOUT') wallet -= amount;
           }
        } else {
           // للادمن والباقي
           if (type === 'DEDUCT' || type === 'CASH_OUT') wallet -= amount;
        }
      } else {
        // ADD, Refund, Bonus, Points, ORDER_FULL كلن بيزيدو
        if (['ADD','REFUND','BONUS','POINTS','ORDER_FULL','COMMISSION'].includes(type) || 
            ['ORDER_COMPLETED','REFUND','BONUS','OVERPAY','TAXI_TOPUP'].includes(reason)) {
          wallet += amount;
        } else {
          // default القديم
          if (type.toLowerCase() !== 'deduct') wallet += amount;
        }
      }
    });

    // للزبون بس: ما بدنا نحسبلو ORDER_FULL_IN و TRANSFER_TO_STORE يلي هني للادمن
    // منرجع نفلتر صح للزبون فقط
    if (ownerUserId || custIdLower) {
      let customerWallet = 0;
      (walletRows||[]).forEach((r) => {
        const isCustomerRow = String(r["Owner Role"]||"").toLowerCase() === 'customer' || String(r["Customer ID"]||"").toLowerCase() === custIdLower;
        if (!isCustomerRow) return;
        const amount = Number(r['Amount'] || 0);
        const type = String(r['Type'] || "").toUpperCase();
        const reason = String(r['Reason'] || "").toUpperCase();
        if (type === 'DEDUCT' || reason === 'CASH_PAYOUT' || reason === 'TAXI_FEE') {
          customerWallet -= amount;
        } else {
          customerWallet += amount;
        }
      });
      wallet = customerWallet;
    }

    const { data: historyRows } = await supabase.from('orders_history').select('*');
    let total_spent = 0;
    (historyRows||[]).forEach((r) => {
      const id = String(r['Costumer ID'] || "").trim().toLowerCase();
      if (id === custIdLower) total_spent += Number(r['Total Amount'] || 0);
    });

    return NextResponse.json({ success: true, points, wallet, total_spent }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return NextResponse.json({ success: true, points: 0, wallet: 0, total_spent: 0, error: e.message }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}

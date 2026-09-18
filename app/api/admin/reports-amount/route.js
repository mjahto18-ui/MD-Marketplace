export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if(!url ||!key) throw new Error("Missing SUPABASE_SERVICE_KEY");
  return createClient(url, key);
}

function parseAnyDate(h: any) {
  const comp = h["Completed Date"] || h["Order Date"];
  if (!comp) return null;
  const d = new Date(comp);
  return isNaN(d.getTime())? null : d;
}

function getWeek(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'daily';
  const storeID = searchParams.get('store_id');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const supabase = getSupabase();

  const [{ data: history }, { data: details }, { data: stores }, { data: users }, { data: payouts }] = await Promise.all([
    supabase.from('orders_history').select('*'),
    supabase.from('order_details').select('*'),
    supabase.from('stores').select('"Store ID", "Store Name"'),
    supabase.from('users').select('"User ID", "Store ID"'),
    supabase.from('cash_payouts').select('*').eq('Status','Completed').eq('Owner Role','Store Owner'),
  ]);

  const storeNameMap: Record<string,string> = {};
  (stores || []).forEach((s: any) => {
    storeNameMap[String(s["Store ID"]).trim()] = s["Store Name"] || String(s["Store ID"]);
  });

  // users."User ID" -> users."Store ID"
  const userIdToStoreId: Record<string,string> = {};
  (users || []).forEach((u: any) => {
    const uid = String(u["User ID"] || "").trim();
    const sid = String(u["Store ID"] || "").trim();
    if(uid && sid) userIdToStoreId[uid] = sid;
  });

  let filteredHistory = (history || []).filter(h => {
    if (period === 'all' &&!from &&!to) return true;
    const d = parseAnyDate(h);
    if (!d) return true;
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to + "T23:59:59")) return false;
    return true;
  });

  let relevantRequestIDs = new Set(filteredHistory.map(h => h["Request ID"]));
  let filteredDetails = (details || []).filter(d => relevantRequestIDs.has(d["Request ID"]));

  if (storeID) {
    filteredDetails = filteredDetails.filter(d => String(d["Store ID"]).trim() === String(storeID).trim());
    const ids = new Set(filteredDetails.map(d => d["Request ID"]));
    filteredHistory = filteredHistory.filter(h => ids.has(h["Request ID"]));
  }

  // فلتر الدفعات حسب التاريخ + حسب المتجر اذا مختار
  let filteredPayouts = (payouts || []).filter((p: any) => {
    const d = p["Created At"]? new Date(p["Created At"]) : null;
    if (from && d && d < new Date(from)) return false;
    if (to && d && d > new Date(to + "T23:59:59")) return false;
    if (storeID) {
      const ownerUid = String(p["Owner User ID"]).trim();
      const mappedStoreId = userIdToStoreId[ownerUid];
      return mappedStoreId === String(storeID).trim();
    }
    return true;
  });

  const totalItems = filteredDetails.reduce((s, d) => s + Number(d["Line Total"] || 0), 0);
  const totalCommission = filteredDetails.reduce((s, d) => s + Number(d["Commission Amount"] || 0), 0);
  const totalDelivery = filteredHistory.reduce((s, h) => s + Number(h["Delivery Fee"] || 0), 0);
  const totalAmount = filteredHistory.reduce((s, h) => s + Number(h["Total Amount"] || 0), 0);

  const group: any = {};
  const effectivePeriod = period === 'all'? 'daily' : period;

  filteredHistory.forEach(h => {
    const date = parseAnyDate(h) || new Date();
    let key;
    if (effectivePeriod === 'daily') key = date.toLocaleDateString('en-GB');
    if (effectivePeriod === 'weekly') key = `اسبوع ${getWeek(date)} - ${date.getFullYear()}`;
    if (effectivePeriod === 'monthly') key = `${date.getMonth() + 1}/${date.getFullYear()}`;
    if (!group[key]) group[key] = { date: key, sortDate: date, orders: 0, items: 0, delivery: 0, commission: 0, total: 0 };
    group[key].orders++;
    group[key].delivery += Number(h["Delivery Fee"] || 0);
    group[key].total += Number(h["Total Amount"] || 0);
  });

  filteredDetails.forEach(d => {
    const h = filteredHistory.find(x => x["Request ID"] === d["Request ID"]);
    if (!h) return;
    const date = parseAnyDate(h) || new Date();
    let key;
    if (effectivePeriod === 'daily') key = date.toLocaleDateString('en-GB');
    if (effectivePeriod === 'weekly') key = `اسبوع ${getWeek(date)} - ${date.getFullYear()}`;
    if (effectivePeriod === 'monthly') key = `${date.getMonth() + 1}/${date.getFullYear()}`;
    if (group[key]) {
      group[key].items += Number(d["Line Total"] || 0);
      group[key].commission += Number(d["Commission Amount"] || 0);
    }
  });

  const storesGroup: any = {};
  filteredDetails.forEach(d => {
    const sid = String(d["Store ID"]).trim();
    if (!storesGroup[sid]) storesGroup[sid] = { store_id: sid, store_name: storeNameMap[sid] || sid, orders: new Set(), items: 0, commission: 0, paid: 0 };
    storesGroup[sid].orders.add(d["Request ID"]);
    storesGroup[sid].items += Number(d["Line Total"] || 0);
    storesGroup[sid].commission += Number(d["Commission Amount"] || 0);
  });

  // وزع الدفعات على المتاجر عن طريق جدول users
  filteredPayouts.forEach((p: any) => {
    const ownerUid = String(p["Owner User ID"]).trim();
    const storeId = userIdToStoreId[ownerUid];
    if (!storeId) return;
    if (!storesGroup[storeId]) {
      // متجر ما باع بهالفترة بس اندفعله - منضيفو ليبين المدفوع
      storesGroup[storeId] = { store_id: storeId, store_name: storeNameMap[storeId] || p["Owner Name"] || storeId, orders: new Set(), items: 0, commission: 0, paid: 0 };
    }
    storesGroup[storeId].paid += Number(p["Amount"] || 0);
  });

  const stores_breakdown = Object.values(storesGroup).map((s: any) => {
    const net = s.items - s.commission; // 135000 يلي بالصورة
    const paid = s.paid || 0;
    return {
     ...s,
      orders: s.orders.size,
      net_to_pay: net,
      paid: paid,
      remaining: net - paid // المستحق
    };
  }).sort((a: any, b: any) => b.items - a.items);

  const totalPaid = filteredPayouts.reduce((sum: number, p: any) => sum + Number(p["Amount"]||0), 0);

  return NextResponse.json({
    success: true,
    period,
    store_id: storeID || "ADMIN - الكل",
    summary: {
      orders: filteredHistory.length,
      items_cost: totalItems,
      delivery_fee: totalDelivery,
      commission: totalCommission,
      total_amount: totalAmount,
      net_for_stores: totalItems - totalCommission,
      total_paid: totalPaid,
      total_remaining: (totalItems - totalCommission) - totalPaid,
      my_net: totalCommission + totalDelivery,
    },
    breakdown: Object.values(group).sort((a: any, b: any) => a.sortDate - b.sortDate).map(({ sortDate,...rest }: any) => rest),
    stores_breakdown
  });
}

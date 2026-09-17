export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function parseAnyDate(h) {
  // هون التصحيح - عم نمشي عال Completed Date
  const comp = h["Completed Date"] || h["Order Date"];
  if (comp) {
    const d = new Date(comp);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function getWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'daily';
  const storeID = searchParams.get('store_id');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const supabase = getSupabase();

  const [{ data: history }, { data: details }, { data: stores }] = await Promise.all([
    supabase.from('orders_history').select('*'),
    supabase.from('order_details').select('*'),
    supabase.from('stores').select('"Store ID", "Store Name"'),
  ]);

  const storeNameMap = {};
  (stores || []).forEach(s => {
    storeNameMap[String(s["Store ID"]).trim()] = s["Store Name"] || String(s["Store ID"]);
  });

  let filteredHistory = (history || []).filter(h => {
    if (period === 'all') return true;
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

  const totalItems = filteredDetails.reduce((s, d) => s + Number(d["Line Total"] || 0), 0);
  const totalCommission = filteredDetails.reduce((s, d) => s + Number(d["Commission Amount"] || 0), 0);
  const totalDelivery = filteredHistory.reduce((s, h) => s + Number(h["Delivery Fee"] || 0), 0);
  const totalAmount = filteredHistory.reduce((s, h) => s + Number(h["Total Amount"] || 0), 0);

  const group = {};
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

  const storesGroup = {};
  filteredDetails.forEach(d => {
    const sid = String(d["Store ID"]).trim();
    if (!storesGroup[sid]) storesGroup[sid] = { store_id: sid, store_name: storeNameMap[sid] || sid, orders: new Set(), items: 0, commission: 0 };
    storesGroup[sid].orders.add(d["Request ID"]);
    storesGroup[sid].items += Number(d["Line Total"] || 0);
    storesGroup[sid].commission += Number(d["Commission Amount"] || 0);
  });

  const stores_breakdown = Object.values(storesGroup).map(s => ({
  ...s, orders: s.orders.size, net_to_pay: s.items - s.commission
  })).sort((a, b) => b.items - a.items);

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
      my_net: totalCommission + totalDelivery,
    },
    breakdown: Object.values(group).sort((a, b) => a.sortDate - b.sortDate).map(({ sortDate,...rest }) => rest),
    stores_breakdown
  });
}

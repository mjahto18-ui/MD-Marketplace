export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'daily'; // daily | monthly | all
  const storeID = searchParams.get('store_id'); // اذا فاضي = تقريرك انت (الادمن)
  const from = searchParams.get('from'); // YYYY-MM-DD
  const to = searchParams.get('to');

  const supabase = getSupabase();

  const [{ data: history }, { data: details }] = await Promise.all([
    supabase.from('orders_history').select('*'),
    supabase.from('order_details').select('*'),
  ]);

  // فلترة تاريخ
  let filteredHistory = history || [];
  if (from || to) {
    filteredHistory = filteredHistory.filter(h => {
      const d = new Date(h["Request Date"] || h["Cerated Date"]);
      if (from && d < new Date(from)) return false;
      if (to && d > new Date(to + "T23:59:59")) return false;
      return true;
    });
  }

  // اذا تقرير تاجر، خلي بس طلباتو
  let relevantRequestIDs = new Set(filteredHistory.map(h => h["Request ID"]));
  let filteredDetails = (details || []).filter(d => relevantRequestIDs.has(d["Request ID"]));

  if (storeID) {
    filteredDetails = filteredDetails.filter(d => String(d["Store ID"]).trim() === String(storeID).trim());
    const ids = new Set(filteredDetails.map(d => d["Request ID"]));
    filteredHistory = filteredHistory.filter(h => ids.has(h["Request ID"]));
  }

  // حسابات عامة
  const totalItems = filteredDetails.reduce((s, d) => s + Number(d["Line Total"] || 0), 0);
  const totalCommission = filteredDetails.reduce((s, d) => s + Number(d["Commission Amount"] || 0), 0);
  const totalDelivery = filteredHistory.reduce((s, h) => s + Number(h["Delivery Fee"] || 0), 0);
  const totalAmount = filteredHistory.reduce((s, h) => s + Number(h["Total Amount"] || 0), 0);

  // تجميع
  const group = {};
  if (period!== 'all') {
    filteredHistory.forEach(h => {
      const date = new Date(h["Request Date"] || h["Cerated Date"]);
      let key;
      if (period === 'daily') key = date.toLocaleDateString('en-GB'); // 17/06/2026
      if (period === 'monthly') key = `${date.getMonth()+1}/${date.getFullYear()}`; // 6/2026

      if (!group[key]) group[key] = { date: key, orders: 0, items: 0, delivery: 0, commission: 0, total: 0 };
      group[key].orders++;
      group[key].delivery += Number(h["Delivery Fee"] || 0);
      group[key].total += Number(h["Total Amount"] || 0);
    });

    // ضيف الكوميشن والبيع لكل مجموعة تاريخ
    filteredDetails.forEach(d => {
      const h = filteredHistory.find(x => x["Request ID"] === d["Request ID"]);
      if (!h) return;
      const date = new Date(h["Request Date"] || h["Cerated Date"]);
      let key;
      if (period === 'daily') key = date.toLocaleDateString('en-GB');
      if (period === 'monthly') key = `${date.getMonth()+1}/${date.getFullYear()}`;
      if (group[key]) {
        group[key].items += Number(d["Line Total"] || 0);
        group[key].commission += Number(d["Commission Amount"] || 0);
      }
    });
  }

  return NextResponse.json({
    success: true,
    period,
    store_id: storeID || "ADMIN - الكل",
    summary: {
      orders: filteredHistory.length,
      items_cost: totalItems, // بيع شامل بدون دلفري
      delivery_fee: totalDelivery, // دلفري بس
      commission: totalCommission, // عمولتك (0 بالتجربة)
      total_amount: totalAmount, // كامل
      net_for_stores: totalItems - totalCommission, // الصافي للتجار
    },
    breakdown: period === 'all'? [] : Object.values(group).sort((a,b) => new Date(a.date) - new Date(b.date)),
  });
}

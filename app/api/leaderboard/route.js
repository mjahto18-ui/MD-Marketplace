import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabase();

    const [{ data: rewardsRows }, { data: walletRows }, { data: historyRows }, { data: tiers }, { data: users }] = await Promise.all([
      supabase.from('rewards').select('"Customer ID", "Bonus Balance", "Transaction Date"').order('"Transaction Date"', { ascending: false }),
      supabase.from('wallet_transactions').select('"Owner User ID", "Balance After", "Created At"').order('"Created At"', { ascending: false }),
      supabase.from('orders_history').select('"Costumer ID", "Total Amount"'),
      supabase.from('loyalty_tiers').select('*').order('tier_level', { ascending: true }),
      supabase.from('users').select('"Customer ID", "Name"')
    ]);

    const map = {};
    const getId = (v) => String(v||"").trim().toLowerCase();

    (rewardsRows||[]).forEach(r => {
      const id = getId(r['Customer ID']);
      if(!id) return;
      if(!map[id]) map[id] = { points: 0, total_spent: 0, raw_id: r['Customer ID'] };
      if(map[id].points === 0 && r['Bonus Balance'] != null) {
        map[id].points = Number(r['Bonus Balance']||0);
      }
    });

    (historyRows||[]).forEach(r => {
      const id = getId(r['Costumer ID']);
      if(!id) return;
      if(!map[id]) map[id] = { points: 0, total_spent: 0, raw_id: r['Costumer ID'] };
      map[id].total_spent += Number(r['Total Amount']||0);
    });

    const usersMap = {};
    (users||[]).forEach(u => usersMap[getId(u['Customer ID'])] = u['Name']);

    let all = Object.values(map).map(m => {
      let currentTier = tiers[0];
      for (let t of tiers) {
        if (m.points >= t.min_points && m.total_spent >= t.min_spent) {
          if (t.tier_level > currentTier.tier_level) currentTier = t;
        }
      }
      return {
        customer_id: m.raw_id,
        display_name: usersMap[getId(m.raw_id)] || `عميل ${m.raw_id}`,
        total_spent: m.total_spent,
        points: m.points,
        tier_name: currentTier.tier_name,
        tier_slug: currentTier.tier_slug,
        color: currentTier.color,
        tier_level: currentTier.tier_level
      };
    }).filter(x => x.total_spent > 0);

    const sortedBySpent = [...all].sort((a,b) => b.total_spent - a.total_spent);
    const top1 = sortedBySpent[0] || null;

    const grouped = {};
    tiers.forEach(t => grouped[t.tier_slug] = []);
    all.forEach(u => {
      if(grouped[u.tier_slug]) grouped[u.tier_slug].push(u);
    });
    for(let slug in grouped) {
      grouped[slug] = grouped[slug].sort((a,b) => b.total_spent - a.total_spent).slice(0,3);
    }

    return NextResponse.json({ success: true, top1, grouped, all: sortedBySpent }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message });
  }
}

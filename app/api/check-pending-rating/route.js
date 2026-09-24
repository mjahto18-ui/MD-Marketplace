export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url ||!key) throw new Error("Supabase env missing");
  return createClient(url, key);
}

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('session');
    const { searchParams } = new URL(request.url);
    let phone = searchParams.get('phone');
    let customerID = searchParams.get('customerID'); // للداشبورد

    if (!phone &&!customerID && session) {
      try { const data = JSON.parse(session.value); phone = data.phone; } catch {}
    }

    let customerId = customerID;

    if (!customerId && phone) {
      const supabaseTmp = getSupabase();
      const { data: customer } = await supabaseTmp
       .from('customers')
       .select('"Customer ID"')
       .eq('Mobile', phone.trim())
       .single();
      if (customer) customerId = customer['Customer ID'];
    }

    if (!customerId) return NextResponse.json({ hasPending: false, pendingIds: [] });

    const supabase = getSupabase();

    // هون شلنا limit(1) - منجيب كل الطلبات يلي بدها تقييم
    const { data: pendingOrders, error } = await supabase
     .from('order_requuest')
     .select('"Request ID"')
     .eq('customer ID', Number(customerId) || customerId)
     .eq('Delivery Status', 'Delivered')
     .eq('Is Rated', false);

    if (error) {
      console.log('check-rating error', error);
      return NextResponse.json({ hasPending: false, pendingIds: [] });
    }

    if (pendingOrders && pendingOrders.length > 0) {
      const ids = pendingOrders.map(o => o['Request ID']);
      return NextResponse.json({
        hasPending: true,
        orderId: ids[0], // للشوب - بضل شغال
        pendingIds: ids, // للداشبورد الجديد
        customerId: customerId
      });
    }

    return NextResponse.json({ hasPending: false, pendingIds: [] });

  } catch (e) {
    console.log('check-pending-rating error', e);
    return NextResponse.json({ hasPending: false, pendingIds: [] });
  }
}

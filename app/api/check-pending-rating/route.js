export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key);
}

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('session');
    
    const { searchParams } = new URL(request.url);
    let phone = searchParams.get('phone');

    if (!phone && session) {
      try {
        const data = JSON.parse(session.value);
        phone = data.phone;
      } catch {}
    }

    if (!phone) {
      return NextResponse.json({ hasPending: false });
    }

    const supabase = getSupabase();

    // 1. جيب Customer ID من رقم التليفون - عندك بجدول customers اسمو "Customer ID" كابيتال
    const { data: customer } = await supabase
      .from('customers')
      .select('"Customer ID"')
      .eq('Mobile', phone.trim())
      .single();

    if (!customer) {
      return NextResponse.json({ hasPending: false });
    }

    const customerId = customer['Customer ID'];

    // 2. شوف اذا عندو طلب Delivered و Is Rated = false
    // عندك بجدول order_requuest اسمو "customer ID" سمول - متل الصورة
    const { data: pendingOrder, error } = await supabase
      .from('order_requuest')
      .select('"Request ID"')
      .eq('customer ID', customerId)
      .eq('Delivery Status', 'Delivered')
      .eq('Is Rated', false)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.log('check-rating error', error);
      return NextResponse.json({ hasPending: false });
    }

    if (pendingOrder) {
      return NextResponse.json({ 
        hasPending: true, 
        orderId: pendingOrder['Request ID'],
        customerId: customerId
      });
    }

    return NextResponse.json({ hasPending: false });

  } catch (e) {
    console.log('check-pending-rating error', e);
    return NextResponse.json({ hasPending: false });
  }
}

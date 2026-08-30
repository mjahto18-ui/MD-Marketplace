export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data: rows } = await supabase.from('reviews').select('*');

    const reviews = (rows||[]).map(row => ({
      reviewId: row['Review ID'],
      customerId: row['Customer ID'],
      storeId: row['Store ID'],
      requestId: row['Request ID'],
      rating: Number(row['Rating']),
      comment: row['Comment'],
      status: row['Status'],
      createdAt: row['Created At'],
    }));

    return NextResponse.json({ success: true, reviews });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message });
  }
}

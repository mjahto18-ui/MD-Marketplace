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
      reviewId: row['Review ID'] || row['review_id'] || row[0],
      customerId: row['Customer ID'] || row['customer_id'] || row[1],
      storeId: row['Store ID'] || row['store_id'] || row[2],
      requestId: row['Request ID'] || row['request_id'] || row[3],
      rating: Number(row['Rating'] || row['rating'] || row[4]),
      comment: row['Comment'] || row['comment'] || row[5],
      status: row['Status'] || row['status'] || row[6],
      createdAt: row['Created At'] || row['created_at'] || row[7],
    }));

    return NextResponse.json({ success: true, reviews });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message });
  }
}

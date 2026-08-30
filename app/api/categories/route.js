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
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw error;

    const categories = (data || []).map(category => ({
      id: category['Category ID'] || category['category_id'] || category['id'],
      name: category['Category Name'] || category['category_name'] || category['name'],
      image: category['Icon'] || category['icon'] || category['image'] // نفس السر: Icon -> image
    })).filter(cat => cat.id && cat.name);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

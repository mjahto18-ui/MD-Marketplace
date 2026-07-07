import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const { phone } = await request.json();
  
  const { data, error } = await supabase
    .from('Customers')
    .select('phone')
    .eq('phone', phone)
    .single();
    
  return NextResponse.json({ exists: !!data });
}

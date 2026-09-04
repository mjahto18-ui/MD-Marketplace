import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.from('areas').select('*');
    if (error) throw error;

    const areas = (data || []).map(r => ({
      id: r["Area ID"],
      name: r["Area Name"],
    }));

    return NextResponse.json({ areas });
  } catch (error) {
    console.error("Areas API Error:", error);
    return NextResponse.json({ areas: [] }, { status: 500 });
  }
}

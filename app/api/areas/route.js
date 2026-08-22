import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabase.from('areas').select('*');
    if (error) throw error;

    const rows = (data || []).map(r => [r.id, r.name]);
    // فوق حولت بيانات Supabase لنفس شكل Google Sheets (مصفوفة)

    const areas = rows.map((row) => ({
      id: row[0],
      name: row[1],
    }));

    return NextResponse.json({ areas });
  } catch (error) {
    console.error("Areas API Error:", error);
    return NextResponse.json({ areas: [] }, { status: 500 });
  }
}

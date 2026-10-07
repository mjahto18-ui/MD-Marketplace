export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const { code } = await req.json();
    if (!code || String(code).length !== 6) {
      return NextResponse.json({ valid: false, error: 'الرمز يجب ان يكون 6 أرقام' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('admin_invite_codes')
      .select('*')
      .eq('code', String(code).trim())
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ valid: false, error: 'الرمز السري ليس موجود' });
    }
    if (data.is_used) {
      return NextResponse.json({ valid: false, error: 'الرمز السري غير فعال ، مستعمل' });
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'الرمز السري منتهي الصلاحية (24 ساعة)' });
    }

    return NextResponse.json({ valid: true, code: data });

  } catch (e) {
    return NextResponse.json({ valid: false, error: e.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function gen6Digit() {
  // 100000 - 999999 مشان ما يبلش بـ 0
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const supabase = getSupabase();
    const cookieStore = cookies();
    
    // منجيب مين الأدمن يلي عم يولد الكود
    let createdBy = null;
    const session = cookieStore.get('session')?.value || cookieStore.get('admin_session')?.value;
    if (session) {
      try {
        const parsed = JSON.parse(session);
        createdBy = parsed.phone || parsed.Mobile || null;
      } catch {
        createdBy = session;
      }
    }

    // اقرا البادي
    let body = {};
    try { body = await req.json(); } catch {}
    const note = body.note || null;
    const count = Math.min(Math.max(parseInt(body.count) || 1, 1), 20); // بين 1 و 20 كود مرة وحدة

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const codesToInsert = [];
    
    // جنريت count أكواد unique
    for (let i = 0; i < count; i++) {
      let code = null;
      let tries = 0;
      while (tries < 15) {
        const candidate = gen6Digit();
        // شيك بالداتا بيز وكمان بالليستة يلي عم نولدها هلق
        const existsInBatch = codesToInsert.find(c => c.code === candidate);
        if (existsInBatch) { tries++; continue; }

        const { data: exists } = await supabase
          .from('admin_invite_codes')
          .select('code')
          .eq('code', candidate)
          .maybeSingle();
        
        if (!exists) {
          code = candidate;
          break;
        }
        tries++;
      }
      if (code) {
        codesToInsert.push({
          code: code,
          is_used: false,
          expires_at: expiresAt,
          created_by: createdBy,
          note: note,
        });
      }
    }

    if (codesToInsert.length === 0) {
      return NextResponse.json({ error: 'ما قدرنا نولد كود، جرب مرة تانية' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('admin_invite_codes')
      .insert(codesToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      codes: data, // مصفوفة
      count: data.length
    });

  } catch (e) {
    console.error('Generate invite error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET ليشوف كل الأكواد يلي ولدها
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('admin_invite_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return NextResponse.json({ codes: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

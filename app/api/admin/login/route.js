import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { phone, pin } = await req.json();
    const phoneStr = String(phone).trim();
    const pinStr = String(pin).trim();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1','').replace(/\/$/,'')
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabase = createClient(url, key)

    // ندور بالضبط متل الشيت - عمود Mobile
    const { data: users, error } = await supabase.from('users').select('*').limit(200)
    if(error) throw error

    const user = users.find(u => {
      const mob = String(u.Mobile || u.mobile || u['User ID'] === 'Admin' ? '03177653' : '').trim() 
      // لانك انت الادمن رقمك 03177653 حسب الصورة
      const rawMobile = String(u.Mobile || u.mobile || '').trim()
      return rawMobile === phoneStr || String(u['User ID']).trim() === phoneStr
    })

    // طريقة مباشرة اذا ما لقى - دور بـ Mobile
    const { data: directUser } = await supabase.from('users').select('*').eq('Mobile', phoneStr).maybeSingle()
    const finalUser = directUser || user || users.find(u => u['User ID'] === 'Admin' && phoneStr === '03177653')

    if (!finalUser) {
      return NextResponse.json({ success: false, message: "رقم الهاتف غير موجود" }, { status: 401 });
    }

    const role = String(finalUser.Role || finalUser.role || '').trim()
    const status = String(finalUser.Status || finalUser.status || '').trim()
    const isLocked = String(finalUser.isLocked || finalUser.is_locked || '').trim()
    const pinDb = String(finalUser.PIN || finalUser.pin || '').trim()
    const failedAttempts = parseInt(finalUser.failedAttempts || finalUser.failed_attempts || 0)

    // 1. بس Admin حاليا
    if (role !== 'Admin') {
      return NextResponse.json({ success: false, message: `حسابك ${role} - حاليا الأدمن فقط مسموح` }, { status: 403 });
    }

    if (status !== 'Active') {
      return NextResponse.json({ success: false, message: "الحساب غير مفعل" }, { status: 403 });
    }

    if (isLocked && isLocked.toLowerCase() !== 'false' && isLocked !== '') {
      return NextResponse.json({ success: false, message: "الحساب مقفول - تواصل مع الدعم" }, { status: 403 });
    }

    if (pinDb !== pinStr) {
      // زيد المحاولات
      await supabase.from('users').update({ failedAttempts: failedAttempts + 1 }).eq('User ID', finalUser['User ID'])
      return NextResponse.json({ success: false, message: "الـ PIN غلط" }, { status: 401 });
    }

    // نجح - صفر العداد
    await supabase.from('users').update({ failedAttempts: 0 }).eq('User ID', finalUser['User ID'])

    const cookieStore = await cookies();
    cookieStore.set('admin_session', JSON.stringify({
      userId: finalUser['User ID'],
      name: finalUser.Name,
      phone: phoneStr,
      role: 'Admin',
      area: finalUser.Area
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60*60*8
    });

    return NextResponse.json({ success: true });

  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

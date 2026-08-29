export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { phone, pin } = await req.json();
    const phoneStr = String(phone).trim();
    const pinStr = String(pin).trim();
    const phoneNoZero = phoneStr.replace(/^0+/, '');

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1','').replace(/\/$/,'')
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabase = createClient(url, key)

    const { data: users } = await supabase.from('users')
   .select('*')
   .or(`Mobile.eq.${phoneStr},Mobile.eq.${phoneNoZero},WhatsApp_x0020_Number.eq.${phoneStr}`)
   .limit(5)

    let finalUser = users?.[0]

    if(!finalUser && phoneStr === '03177653'){
      const { data } = await supabase.from('users').select('*').eq('User ID','Admin').maybeSingle()
      finalUser = data
    }

    if (!finalUser) return NextResponse.json({ success: false, message: "رقم غير موجود" }, { status: 401 });

    const role = String(finalUser.Role || '').trim()
    const status = String(finalUser.Status || '').trim()
    const pinDb = String(finalUser.PIN || '').trim()

    // هون التصحيح الأساسي للـ Active
    const activeRaw = finalUser.Active
    const activeStr = String(activeRaw).toLowerCase()
    const isActive = activeRaw === true || activeStr === 'true' || activeStr === 'TRUE' || activeStr === '1'

    if(!isActive){
      return NextResponse.json({ success: false, message: `حسابك موقوف - Active = ${finalUser.Active}` }, { status: 403 });
    }

    if (status!== 'Active'){
      return NextResponse.json({ success: false, message: `الحساب غير مفعل - Status = ${status}` }, { status: 403 });
    }

    const allowedRoles = ['Admin','Store Owner','Driver','Assistant Admin','Accounting']
    if(!allowedRoles.includes(role)){
      return NextResponse.json({ success: false, message: `دورك ${role} غير مسموح حاليا` }, { status: 403 });
    }

    if (pinDb!== pinStr) return NextResponse.json({ success: false, message: "PIN غلط" }, { status: 401 });

    const cookieStore = await cookies();
    cookieStore.set('admin_session', JSON.stringify({
      userId: finalUser['User ID'],
      name: finalUser.Name,
      phone: phoneStr,
      role: role,
      storeId: finalUser['Store ID'] || finalUser.Store_ID || null,
      area: finalUser.Area || null,
      relatedId: finalUser['Related ID'] || null
    }), { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 60*60*8 });

    // هون صار ياخدك عالداشبورد
    return NextResponse.json({ success: true, role });

  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

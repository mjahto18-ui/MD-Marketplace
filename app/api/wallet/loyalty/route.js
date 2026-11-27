export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    const serviceAccount = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON || '{}');

    if (!issuerId) {
      return NextResponse.json({ error: 'ISSUER_ID ناقص - Vercel' }, { status: 500 });
    }
    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      return NextResponse.json({ error: 'SERVICE_ACCOUNT_JSON ناقص - Vercel' }, { status: 500 });
    }

    // --- جيب المتاجر الناشطة - من Supabase ---
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: stores } = await supabase
      .from('stores')
      .select('"Store ID", "Store Name", "Current Latitude", "Current Longitude", "Status"')
      .eq('Status', 'Active');

    // --- جيب رسائل المتاجر - من store_messages - بس الناشطة ---
    const { data: msgs } = await supabase
      .from('store_messages')
      .select('store_id, title, body')
      .eq('is_active', true);

    // --- ربط الرسالة - بمتجرها ---
    const msgMap = {};
    (msgs || []).forEach((m) => {
      msgMap[m.store_id] = m;
    });

    // --- بس المتاجر اللي عندا مسج true - بينحطو - الباقي صامت - بلا Fallback ---
    const locations = (stores || [])
      .filter((s) => {
        const m = msgMap[s["Store ID"]];
        return m && Number(s["Current Latitude"]) && Number(s["Current Longitude"]);
      })
      .map((s) => {
        const m = msgMap[s["Store ID"]];
        return {
          latitude: Number(s["Current Latitude"]),
          longitude: Number(s["Current Longitude"]),
          relevantText: m.title + ' - ' + m.body
        };
      });

    // --- الاوبجكت - Loyalty - للتجربة - زبون واحد ---
    // --- الكلاس - ما منبعتو - لانو موجود بالكونسول - md_loyalty1 - APPROVED ---
    const loyaltyObject = {
      id: issuerId + '.md_loyalty_test_004',
      classId: issuerId + '.md_loyalty1',
      state: 'active',
      accountName: 'Mouhamad Jahto',
      accountId: 'MD-004',
      loyaltyPoints: {
        label: 'الختم',
        balance: {
          string: '0 من 5',
        },
      },
      textModulesData: [
        {
          header: 'كرتك الذكي',
          body: 'كرت واحد - لكل المتاجر - وين ما مرقت حد متجر - بيطلعلك عرضو',
        },
        {
          header: 'الرصيد',
          body: '0 - للتجربة',
        },
        {
          header: 'Free Delivery',
          body: '0 - السادسة توصيل مجاني',
        },
        {
          header: 'المتاجر',
          body: 'كل المتاجر الناشطة - اللي عندا عرض - بيشتغل فيهن كرتك',
        },
      ],
      barcode: {
        type: 'qrCode',
        value: 'MD-LOYALTY-004',
      },
      // --- التنبيه - بس تقرب على متجر عندو مسج - نفسو متل Generic ---
      locations: locations,
      notifyPreference: 'NOTIFY_ON_ENTRY',
      // --- Default - بس اول مرة - بس تعمل Add ---
      messages: [{
        header: 'أهلا فيك بـ MD-Marketplace',
        body: 'كرتك صار فعال - العروض بتوصلك بس تقرب على المتاجر',
        messageType: 'TEXT_AND_NOTIFY',
      }],
    };

    const claims = {
      iss: serviceAccount.client_email,
      aud: 'google',
      typ: 'savetowallet',
      payload: {
        loyaltyObjects: [loyaltyObject],
      },
    };

    const token = jwt.sign(claims, serviceAccount.private_key, { algorithm: 'RS256' });
    const saveLink = 'https://pay.google.com/gp/v/save/' + token;

    // اذا ?debug=1 - فرجي JSON - للفحص
    // اذا لا - روح دغري - على غوغل
    const url = new URL(request.url);
    if (url.searchParams.get('debug') === '1') {
      return NextResponse.json({ saveLink, storesCount: locations.length, messagesCount: (msgs || []).length });
    }

    return NextResponse.redirect(saveLink);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

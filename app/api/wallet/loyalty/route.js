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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // --- جيب رقم التلفون - من الرابط - ?phone= ---
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone') || '03177653';

    // --- جيب الزبون - من customers - بـ Mobile ---
    const { data: customer } = await supabase
      .from('customers')
      .select('"Customer ID", "Name", "Mobile", "Free Delivery Remaining"')
      .eq('Mobile', phone)
      .maybeSingle();

    const custId = customer?.["Customer ID"] || '';
    const custName = customer?.["Name"] || 'Mouhamad Jahto';
    const freeRemaining = customer?.["Free Delivery Remaining"] || '5';

    // --- جيب User ID - من users - بـ Customer ID ---
    const { data: userRow } = await supabase
      .from('users')
      .select('"User ID"')
      .eq('Customer ID', custId)
      .maybeSingle();

    const ownerUserId = userRow?.["User ID"] || null;

    // --- جيب المحفظة و النقاط - متل API اللي عندك ---
    const [rewardsRes, walletRes] = await Promise.all([
      supabase.from('rewards')
        .select('"Bonus Balance"')
        .eq('Customer ID', custId)
        .order('Transaction Date', { ascending: false })
        .order('supa_id', { ascending: false })
        .limit(1)
        .maybeSingle(),
      ownerUserId
        ? supabase.from('wallet_transactions')
          .select('"Balance After"')
          .eq('Owner User ID', ownerUserId)
          .order('Created At', { ascending: false })
          .order('supa_id', { ascending: false })
          .limit(1)
          .maybeSingle()
        : supabase.from('wallet_transactions')
          .select('"Balance After"')
          .eq('Owner User ID', custId)
          .order('Created At', { ascending: false })
          .limit(1)
          .maybeSingle(),
    ]);

    const points = Number(rewardsRes.data?.["Bonus Balance"] || 0);
    const wallet = Number(walletRes.data?.["Balance After"] || 0);

    // --- جيب المتاجر الناشطة - من Supabase ---
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

    // --- بس المتاجر اللي عندا مسج true - بينحطو ---
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

    // --- الاوبجكت - Loyalty - متل المصرف - بس الضروري ---
    const cleanPhone = String(phone).replace(/\D/g, '');
    const loyaltyObject = {
      id: issuerId + '.md_loyalty_' + cleanPhone,
      classId: issuerId + '.md_loyalty1',
      state: 'active',
      accountName: custName,
      accountId: phone,
      loyaltyPoints: {
        label: 'Free Delivery - باقي',
        balance: {
          string: String(freeRemaining),
        },
      },
      textModulesData: [
        {
          header: 'المحفظة',
          body: String(wallet),
        },
        {
          header: 'النقاط',
          body: String(points),
        },
      ],
      barcode: {
        type: 'qrCode',
        value: 'MD-' + phone,
      },
      locations: locations,
      notifyPreference: 'NOTIFY_ON_ENTRY',
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

    // --- سجل مين نزل الكرت - مشان نشوف كم شخص منزلو ---
try {
  await supabase.from('wallet_downloads').insert([{
    phone: phone,
    name: custName,
    created_at: new Date().toISOString()
  }]);
} catch (e) {}

    if (url.searchParams.get('debug') === '1') {
      return NextResponse.json({ saveLink, storesCount: locations.length, messagesCount: (msgs || []).length, custName, phone, wallet, points, freeRemaining });
    }

    return NextResponse.redirect(saveLink);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

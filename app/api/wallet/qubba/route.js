export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    const serviceAccount = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON || '{}');

    if (!issuerId) {
      return NextResponse.json({ error: 'ISSUER_ID ناقص - Vercel' }, { status: 500 });
    }
    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      return NextResponse.json({ error: 'SERVICE_ACCOUNT_JSON ناقص - Vercel' }, { status: 500 });
    }

    // --- جيب كل الابراج - الناشطة - من Supabase ---
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: towers } = await supabase
      .from('geofence_centers')
      .select('id, name, center_lat, center_lng')
      .eq('is_active', true);

    // --- جديد - جيب رسائل الابراج - من tower_messages ---
    const { data: msgs } = await supabase
      .from('tower_messages')
      .select('geofence_center_id, title, body')
      .eq('is_active', true);

    // --- جديد - ربط الرسالة - ببرجها ---
    const msgMap = {};
    (msgs || []).forEach((m) => {
      msgMap[m.geofence_center_id] = m;
    });

    // --- كل مواقع الابراج - بنفس الكرت الذكي - كل واحد - برسالتو ---
    const locations = (towers || [])
      .filter((t) => Number(t.center_lat) && Number(t.center_lng))
      .map((t) => {
        const m = msgMap[t.id];
        const text = m ? m.body : 'انت ببرج ' + (t.name || '') + ' - شو بدك نوصيلك اليوم؟';
        return {
          latitude: Number(t.center_lat),
          longitude: Number(t.center_lng),
          relevantText: text,
        };
      });

    // --- احتياط - اذا ما لقى ابراج - حط القبة ---
    if (locations.length === 0) {
      locations.push({
        latitude: 34.43515968148,
        longitude: 35.8571863341421,
        relevantText: 'انت ببرج القبة - شو بدك نوصيلك اليوم؟',
      });
    }

    // --- الكرت الذكي - واحد - للكل ---
    const genericClass = {
      id: issuerId + '.smart_card',
      issuerName: 'MD Marketplace',
    };

    const genericObject = {
      id: issuerId + '.smart_card_test_001',
      classId: issuerId + '.smart_card',
      state: 'ACTIVE',
      cardTitle: {
        defaultValue: { language: 'ar', value: 'MD-Marketplace - كرتك الذكي' },
      },
      header: {
        defaultValue: { language: 'ar', value: 'أهلا فيك - وين ما كنت' },
      },
      textModulesData: [
        {
          header: 'كرتك الذكي',
          body: 'كرت واحد - لكل الابراج - وين ما فتت على برج - بيطلعلك عرضو',
        },
        {
          header: 'الختم - للتجربة',
          body: '0 من 5 - السادسة توصيل مجاني',
        },
        {
          header: 'الابراج',
          body: 'القبة - و كل الابراج الناشطة - بيشتغل فيهن كرتك',
        },
      ],
      barcode: {
        type: 'QR_CODE',
        value: 'MD-SMART-001',
      },
      // --- التنبيه - بس تقرب على أي برج ---
      locations: locations,
      notifyPreference: 'NOTIFY_ON_ENTRY',
      messages: [{
        header: 'أهلا فيك ببرجك',
        body: 'شو بدك نوصيلك اليوم؟ - باقيلك 5 و بتربح توصيل مجاني',
        messageType: 'TEXT_AND_NOTIFY',
      }],
    };

    const claims = {
      iss: serviceAccount.client_email,
      aud: 'google',
      typ: 'savetowallet',
      payload: {
        genericClasses: [genericClass],
        genericObjects: [genericObject],
      },
    };

    const token = jwt.sign(claims, serviceAccount.private_key, { algorithm: 'RS256' });
    const saveLink = 'https://pay.google.com/gp/v/save/' + token;

    return NextResponse.json({ saveLink, towersCount: locations.length, messagesCount: (msgs || []).length });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

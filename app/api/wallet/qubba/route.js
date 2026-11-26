import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    const serviceAccount = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON || '{}');

    // 1. شكل الكرت - Class - برج القبة - مرة وحدة
    const loyaltyClass = {
      id: `${issuerId}.qubba_class`,
      issuerName: 'MD Marketplace',
      programName: 'MD-Marketplace - برج القبة',
      programLogo: {
        sourceUri: { uri: 'https://www.md-marketplace.store/logo.png' },
      },
      rewardsTier: 'Gold',
      rewardsTierLabel: 'برج القبة',
      // هون - موقع القبة - للتنبيه
      locations: [{
        latitude: 34.43515968148,
        longitude: 35.8571863341421,
      }],
      // رسالة التنبيه بس يقرب
      messages: [{
        header: 'أهلا فيك ببرج القبة',
        body: 'شو بدك نوصيلك اليوم؟ - باقيلك 5 و بتربح توصيل مجاني',
      }],
    };

    // 2. كرت الزبون - Object - للتجربة - ختم 0 من 5
    const loyaltyObject = {
      id: `${issuerId}.qubba_test_${Date.now()}`,
      classId: `${issuerId}.qubba_class`,
      state: 'ACTIVE',
      accountId: 'qubba_test_user',
      accountName: 'زبون القبة - تجربة',
      loyaltyPoints: {
        label: 'ختم',
        balance: { int: 0 },
      },
      barcode: {
        type: 'QR_CODE',
        value: 'MD-QUBBA-TEST-001',
      },
    };

    // 3. التوقيع - JWT
    const claims = {
      iss: serviceAccount.client_email,
      aud: 'google',
      typ: 'savetowallet',
      payload: {
        loyaltyClasses: [loyaltyClass],
        loyaltyObjects: [loyaltyObject],
      },
    };

    const token = jwt.sign(claims, serviceAccount.private_key, { algorithm: 'RS256' });
    const saveLink = `https://pay.google.com/gp/v/save/${token}`;

    return NextResponse.json({ saveLink });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

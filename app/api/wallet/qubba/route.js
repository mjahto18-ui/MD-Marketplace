import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    const serviceAccount = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON || '{}');

    // كرت عام - Generic - للتجربة - بلا موافقة
    const genericClass = {
      id: `${issuerId}.qubba_generic`,
      issuerName: 'MD Marketplace',
      // هون - موقع القبة
      locations: [{
        latitude: 34.43515968148,
        longitude: 35.8571863341421,
      }],
    };

    const genericObject = {
      id: `${issuerId}.qubba_test_${Date.now()}`,
      classId: `${issuerId}.qubba_generic`,
      state: 'ACTIVE',
      cardTitle: {
        defaultValue: { language: 'ar', value: 'MD-Marketplace - برج القبة' },
      },
      header: {
        defaultValue: { language: 'ar', value: 'أهلا فيك ببرج القبة' },
      },
      textModulesData: [
        {
          header: 'برجك',
          body: 'انت هلأ ببرج القبة - شو بدك نوصيلك اليوم؟',
        },
        {
          header: 'الختم - للتجربة',
          body: '0 من 5 - السادسة توصيل مجاني',
        },
      ],
      barcode: {
        type: 'QR_CODE',
        value: 'MD-QUBBA-TEST-001',
      },
      // التنبيه بس تقرب
      messages: [{
        header: 'أهلا فيك ببرج القبة',
        body: 'شو بدك نوصيلك اليوم؟ - باقيلك 5 و بتربح توصيل مجاني',
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
    const saveLink = `https://pay.google.com/gp/v/save/${token}`;

    return NextResponse.json({ saveLink });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

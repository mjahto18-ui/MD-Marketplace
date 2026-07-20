import { getGlobalConfig } from '@/lib/getGlobalConfig';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const config = await getGlobalConfig();
    
    // اطبع بالـ logs شو قرا
    console.log("CONFIG FROM SHEET:", JSON.stringify(config));
    
    return new Response(JSON.stringify(config), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (e) {
    console.log("API ERROR:", e);
    return new Response(JSON.stringify({ error: e.message, isCartClosed: false }), {
      status: 500,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}

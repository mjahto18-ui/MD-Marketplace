import { getGlobalConfig, clearGlobalConfigCache } from '@/lib/getGlobalConfig';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const config = await getGlobalConfig();
    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json', 
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    console.error("Config API Error:", e);
    return new Response(JSON.stringify({ 
      isLocked: false, 
      isCartClosed: false, 
      isComingSoon: false,
      cart_closed_message: "",
      emergency_lock_message: "",
      coming_soon_message: ""
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store' // ضيفها هون كمان!
      }
    });
  }
}

// لما تعدل md_global_control من الادمن
export async function POST() {
  clearGlobalConfigCache();
  return Response.json({ cleared: true });
}

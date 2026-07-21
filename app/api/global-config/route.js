import { getGlobalConfig } from '@/lib/getGlobalConfig';

export const dynamic = 'force-dynamic';

let cache = { data: null, time: 0 };
const TTL = 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();
    if (cache.data && (now - cache.time) < TTL) {
      return new Response(JSON.stringify(cache.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const config = await getGlobalConfig();
    cache = { data: config, time: now };

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    if (cache.data) {
      return new Response(JSON.stringify(cache.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ 
      isLocked: false, 
      isCartClosed: false, 
      isComingSoon: false,
      cart_closed_message: "",
      emergency_lock_message: "",
      coming_soon_message: ""
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

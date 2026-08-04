const VERIFY_TOKEN = 'mjahto123';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK VERIFIED');
    return new Response(challenge, { status: 200 });
  } else {
    return new Response('Forbidden', { status: 403 });
  }
}

export async function POST(req) {
  const body = await req.json();
  console.log('WhatsApp Webhook:', JSON.stringify(body, null, 2));
  
  return Response.json({ status: 'ok' }, { status: 200 });
}

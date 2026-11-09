import { put } from '@vercel/blob';
export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file) return Response.json({ error: 'no file' }, { status: 400 });
    const blob = await put(`special-orders/${Date.now()}.webp`, file, { access: 'public', contentType: 'image/webp' });
    return Response.json({ url: blob.url });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}

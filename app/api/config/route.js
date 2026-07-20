import { getGlobalConfig } from '@/lib/getGlobalConfig';

export async function GET() {
  const config = await getGlobalConfig();
  return Response.json(config, {
    headers: { 'Cache-Control': 'no-store' } // مهم جدا مشان يقرا لحظي
  });
}

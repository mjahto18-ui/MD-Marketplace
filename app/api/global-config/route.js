import { getGlobalConfig } from '@/lib/getGlobalConfig';

export async function GET() {
  try {
    const config = await getGlobalConfig();
    return Response.json(config);
  } catch (e) {
    return Response.json({ error: e.message, platform_status: {value:'open'} }, { status: 500 });
  }
}

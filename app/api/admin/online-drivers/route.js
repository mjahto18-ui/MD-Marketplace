export const dynamic = "force-dynamic";
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(){
  try {
    // جيب السائقين اللي حدثو موقعن بآخر 5 دقايق بس
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('drivers')
      .select(`"Driver ID", "Driver Name", "Mobile", "Current Latitude", "Current Longitude", "Last Location Update", "Status"`)
      .gte('"Last Location Update"', fiveMinAgo)
      .not('"Current Latitude"', 'is', null)

    if(error) return Response.json({error: error.message}, {status:500})

    const result = (data || []).map(d=>({
      driverId: d['Driver ID'],
      name: d['Driver Name'],
      mobile: d['Mobile'],
      lat: parseFloat(d['Current Latitude']),
      lng: parseFloat(d['Current Longitude']),
      lastUpdate: d['Last Location Update'],
      status: d['Status'],
      // هون للتوافق مع الماب تبعك
      'Driver ID': d['Driver ID'],
      'Driver Name': d['Driver Name']
    })).filter(d=> !isNaN(d.lat) && !isNaN(d.lng))

    return Response.json(result)
  } catch(e){
    return Response.json({error: e.message}, {status:500})
  }
}

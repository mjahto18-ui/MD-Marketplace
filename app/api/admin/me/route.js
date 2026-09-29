import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(){
  const cookieStore = await cookies();
  const sessionStr = cookieStore.get('admin_session')?.value
  if(!sessionStr) return NextResponse.json({ logged:false }, {status:401})

  const session = JSON.parse(sessionStr)
  const taxiId = session.Taxi_ID || session.taxiId || session.relatedId

  if(!taxiId){
    return NextResponse.json({ logged:true, ...session })
  }

  // جيب لايف من الداتا بيز
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data: driver } = await supabase.from('taxi_drivers')
    .select('Taxi_ID, full_name, vehicle_type, engine_cc, car_type, is_online, status')
    .eq('Taxi_ID', taxiId)
    .single()

  if(driver){
    return NextResponse.json({ 
      logged:true, 
      ...session,
      vehicle_type: driver.vehicle_type,
      engine_cc: driver.engine_cc,
      Taxi_Engine: driver.engine_cc,
      car_type: driver.car_type,
      full_name: driver.full_name,
      name: driver.full_name,
      Taxi_ID: driver.Taxi_ID
    })
  }

  return NextResponse.json({ logged:true,...session })
}

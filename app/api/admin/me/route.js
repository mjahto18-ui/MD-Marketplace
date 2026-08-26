import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function GET(){
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value
  if(!session) return NextResponse.json({ logged:false }, {status:401})
  return NextResponse.json({ logged:true,...JSON.parse(session) })
}

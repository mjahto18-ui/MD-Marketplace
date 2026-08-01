import { NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    
    // Log guest visit
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "GuestLogs!A:C",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          new Date().toISOString(),
          req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          req.headers.get('user-agent') || 'unknown'
        ]],
      },
    });
    
    // حط كوكي الزائر من السيرفر - هاي اللي بتحل مشكلة التلفون
    const cookieStore = cookies();
    
    // 1. امحي session اذا موجودة
    cookieStore.delete('session');
    
    // 2. حط كوكي الزائر
    cookieStore.set('md_guest', 'true', {
      httpOnly: false, // لازم false عشان نقراه بـ JS
      secure: false, // بس عالـ HTTPS
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // يوم واحد
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // حتى لو فشل الـ log، حط الكوكي وخليه يفوت كزائر
    const cookieStore = cookies();
    cookieStore.delete('session');
    cookieStore.set('md_guest', 'true', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });
    return NextResponse.json({ success: true });
  }
}

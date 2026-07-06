import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { google } from "googleapis";

export async function GET() {
  const userCookie = cookies().get('md_user');
  if (!userCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const basicUser = JSON.parse(userCookie.value);

  // منجيب باقي البيانات من Users
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: "Users!A2:Z",
  });

  const users = res.data.values || [];
  // نفترض: A=0 ID, B=1 Name, D=3 Phone, E=4 Area, F=5 Address, I=8 FreeDeliveries, K=10 Lat, L=11 Lng
  const fullUser = users.find(row => row[0] === basicUser.customerId);

  if (!fullUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    user: {
      customerId: fullUser[0],
      name: fullUser[1],
      phone: fullUser[2],
      area: fullUser[3],
      address: fullUser[4],
      freeDeliveries: parseInt(fullUser[8]) || 0,
      lat: parseFloat(fullUser[9]) || 33.8938,
      lng: parseFloat(fullUser[10]) || 35.5018,
    }
  });
}

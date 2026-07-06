import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { google } from 'googleapis';

export async function GET() {
  const cookieStore = cookies();
  const session = cookieStore.get('session');

  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  const userPhone = JSON.parse(session.value).phone;

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. جيب معلومات اليوزر من جدول Users
    const usersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Users!A:Z',
    });

    const usersRows = usersRes.data.values;
    const usersHeaders = usersRows[0];
    const userRow = usersRows.slice(1).find(row => row[usersHeaders.indexOf('Mobile')] === userPhone);

    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = {};
    usersHeaders.forEach((header, i) => {
      userData[header] = userRow[i] || null;
    });

    // 2. جيب معلومات الكوستومر من جدول Customers عن طريق Mobile
    const customersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Customers!A:Z',
    });

    const customersRows = customersRes.data.values;
    const customersHeaders = customersRows[0];
    const customerRow = customersRows.slice(1).find(row => row[customersHeaders.indexOf('Mobile')] === userPhone);

    let customerData = {};
    if (customerRow) {
      customersHeaders.forEach((header, i) => {
        customerData[header] = customerRow[i] || null;
      });
    }

    // 3. اختار الاحداثيات: Current اذا موجود، اذا لا Registration
    let lat = customerData['Current Latitude'] || customerData['Registration Latitude'] || null;
    let lng = customerData['Current Longtitude'] || customerData['Registration Longitude'] || null; // انتبه Longtitude هيك مكتوبة عندك

    // 4. ادمج كلشي سوا
    return NextResponse.json({
      user: {
        name: userData['Name'],
        phone: userData['Mobile'],
        role: userData['Role'] || 'Customer',
        email: userData['Email'],
        status: userData['Status'],

        // من جدول Customers
        customerId: customerData['Customer ID'],
        area: customerData['Area'],
        address: customerData['Adress'], // انتبه Adress هيك مكتوبة عندك
        freeDeliveries: parseInt(customerData['Free Delivery Remaining']) || 0,
        lat: lat,
        lng: lng,
        lastLocationUpdate: customerData['Last Location Update']
      }
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

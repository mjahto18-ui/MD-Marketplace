import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { google } from 'googleapis';

export async function GET() {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('session');

    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    let phone = null;
    try {
      phone = JSON.parse(session.value).phone;
    } catch {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // USERS
    const usersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Users!A:Z',
    });

    const usersRows = usersRes.data.values || [];
    if (usersRows.length < 2) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const usersHeaders = usersRows[0];
    const mobileIndex = usersHeaders.indexOf('Mobile');

    if (mobileIndex === -1) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const userRow = usersRows.slice(1).find(row => row[mobileIndex] === phone);

    if (!userRow) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const userData = {};
    usersHeaders.forEach((header, i) => {
      userData[header] = userRow[i] || null;
    });

    // CUSTOMERS
    const customersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Customers!A:Z',
    });

    const customersRows = customersRes.data.values || [];
    let customerData = {};

    if (customersRows.length > 1) {
      const customersHeaders = customersRows[0];
      const mobileIndex2 = customersHeaders.indexOf('Mobile');

      if (mobileIndex2 !== -1) {
        const customerRow = customersRows.slice(1).find(row => row[mobileIndex2] === phone);

        if (customerRow) {
          customersHeaders.forEach((header, i) => {
            customerData[header] = customerRow[i] || null;
          });
        }
      }
    }

    const lat =
      customerData['Current Latitude'] ||
      customerData['Registration Latitude'] ||
      null;

    const lng =
      customerData['Current Longtitude'] ||
      customerData['Registration Longitude'] ||
      null;

    return NextResponse.json({
      user: {
        name: userData['Name'],
        phone: userData['Mobile'],
        role: userData['Role'] || 'Customer',
        email: userData['Email'],
        status: userData['Status'],

        customerId: customerData['Customer ID'],
        area: customerData['Area'],
        address: customerData['Adress'],
        freeDeliveries: parseInt(customerData['Free Delivery Remaining']) || 0,
        lat,
        lng,
        lastLocationUpdate: customerData['Last Location Update'],
      },
    });

  } catch (error) {
    console.log("ME API Error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

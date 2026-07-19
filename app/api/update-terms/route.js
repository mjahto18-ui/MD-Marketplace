import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request) {
  try {
    const { AcceptedTerms } = await request.json();

    // جيب session من الكوكيز (رقم الهاتف)
    const cookie = request.headers.get("cookie");
    const session = cookie?.match(/session=([^;]+)/)?.[1];

    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    // اربط Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // جيب كل اليوزرز
    const usersSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Users!A:R",
    });

    const rows = usersSheet.data.values;

    // دور على الصف اللي فيه رقم الهاتف (Mobile = العمود الخامس = index 4)
    const userRowIndex = rows.findIndex((row) => row[4] === session);

    if (userRowIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // عدّل AcceptedTerms داخل العمود R (index 17)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `Users!R${userRowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[AcceptedTerms]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

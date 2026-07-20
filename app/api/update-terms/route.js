import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request) {
  try {
    const { AcceptedTerms } = await request.json();

    const cookie = request.headers.get("cookie");
    const raw = cookie?.match(/session=([^;]+)/)?.[1];
    if (!raw) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const decoded = decodeURIComponent(raw);
    const sessionData = JSON.parse(decoded);
    const phone = sessionData.phone;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const usersSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Users!A:R",
    });

    const rows = usersSheet.data.values;
    const userRowIndex = rows.findIndex((row) => row[4] === phone);

    if (userRowIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valueToSave = AcceptedTerms? "TRUE" : "FALSE";

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `Users!R${userRowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[valueToSave]],
      },
    });

    // *** الحل هون - حدث الـ session ***
    const newSession = {...sessionData, AcceptedTerms: true, acceptedTerms: true };
    const response = NextResponse.json({ success: true });

    response.cookies.set('session', JSON.stringify(newSession), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 يوم
    });

    return response;

  } catch (err) {
    console.error("UPDATE TERMS ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

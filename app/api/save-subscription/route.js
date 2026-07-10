import { google } from "googleapis";

export async function POST(req) {
  try {
    const { userId, subscriptionId } = await req.json();

    console.log("========== SAVE SUBSCRIPTION ==========");
    console.log("USER ID =", userId);
    console.log("SUB ID =", subscriptionId);

    if (!userId || !subscriptionId) {
      console.log("❌ Missing data");
      return Response.json({
        success: false,
        message: "Missing data"
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    });

    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const read = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Users!A:Q",
    });

    const rows = read.data.values || [];

    const rowIndex = rows.findIndex(
      (row) => row[0] === userId.toString()
    );

    console.log("ROW INDEX =", rowIndex);

    if (rowIndex === -1) {
      console.log("❌ User not found");
      return Response.json({
        success: false,
        message: "User not found",
      });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Users!Q${rowIndex + 2}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[subscriptionId]],
      },
    });

    console.log("✅ Subscription Saved Successfully");

    return Response.json({
      success: true,
      message: "Subscription ID saved successfully",
    });

  } catch (err) {
    console.error("❌ SAVE SUBSCRIPTION ERROR");
    console.error(err);

    return Response.json({
      success: false,
      message: "Server error",
    });
  }
}

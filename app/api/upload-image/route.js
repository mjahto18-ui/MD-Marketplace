const APP_ID = process.env.APPSHEET_APP_ID;
const API_KEY = process.env.APPSHEET_API_KEY;

export async function POST(req) {
  try {
    const data = await req.json();
    console.log("Incoming data ref:", data.ref);
    
    const payload = {
      Action: "Add",
      Properties: { Locale: "en-US" },
      Rows: [{
        "REF": data.ref,
        "Photo 1": data.photo1 || "",
        "Photo 2": data.photo2 || "",
        "Photo 3": data.photo3 || "",
      }]
    };

    console.log("Sending to AppSheet:", APP_ID);

    const res = await fetch(`https://api.appsheet.com/api/v2/apps/${APP_ID}/tables/Protection Cases/Action`, {
      method: "POST",
      headers: {
        "ApplicationAccessKey": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log("AppSheet response:", res.status, text);

    if (!res.ok) throw new Error(`AppSheet ${res.status}: ${text}`);

    return Response.json({ success: true, result: text });
  } catch (e) {
    console.error("ERROR:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

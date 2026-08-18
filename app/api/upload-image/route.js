const APP_ID = process.env.APPSHEET_APP_ID;
const API_KEY = process.env.APPSHEET_API_KEY;

export async function POST(req) {
  try {
    const data = await req.json(); // { ref, description, photo1, photo2, photo3 ... }
    
    const res = await fetch(`https://api.appsheet.com/api/v2/apps/${APP_ID}/tables/Protection Cases/Action`, {
      method: "POST",
      headers: {
        "ApplicationAccessKey": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Action: "Add",
        Properties: { Locale: "en-US", Timezone: "Arabian Standard Time" },
        Rows: [
          {
            "REF": data.ref,
            "Description": data.description,
            "Photo 1": data.photo1 || "", // base64 من الفرونت
            "Photo 2": data.photo2 || "",
            "Photo 3": data.photo3 || "",
            "Date": new Date().toISOString(),
          }
        ]
      })
    });

    const result = await res.text();
    if (!res.ok) throw new Error(result);

    return Response.json({ success: true, result });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

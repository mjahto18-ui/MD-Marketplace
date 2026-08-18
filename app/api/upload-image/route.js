const APP_ID = process.env.APPSHEET_APP_ID;
const API_KEY = process.env.APPSHEET_API_KEY;

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file) throw new Error("No file");

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const newCaseId = `REF-${String(Date.now()).slice(-6)}`;

    const res = await fetch(`https://api.appsheet.com/api/v2/apps/${APP_ID}/tables/Protection Cases/Action`, {
      method: "POST",
      headers: {
        "ApplicationAccessKey": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Action: "Add",
        Properties: { Locale: "en-US" },
        Rows: [{
          "Case ID": newCaseId,
          "Photo 1": base64,
          "Status": "Pending"
        }]
      })
    });

    const text = await res.text();
    console.log("AppSheet:", res.status, text);
    if (!res.ok) throw new Error(text);

    return Response.json({ success: true });
  } catch (e) {
    console.error("ERROR:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

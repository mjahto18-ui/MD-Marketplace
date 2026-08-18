const APP_ID = process.env.APPSHEET_APP_ID;
const API_KEY = process.env.APPSHEET_API_KEY;

export async function POST(req) {
  try {
    let photo1 = "", photo2 = "", photo3 = "", ref = "";

    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      // جاي من فورم قديم
      const form = await req.formData();
      const file = form.get("file");
      ref = form.get("ref") || `TEST-${Date.now()}`;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        photo1 = `data:${file.type};base64,${buffer.toString("base64")}`;
      }
    } else {
      // جاي JSON جديد
      const data = await req.json();
      photo1 = data.photo1 || data.imageFile || "";
      photo2 = data.photo2 || "";
      photo3 = data.photo3 || "";
      ref = data.ref || `TEST-${Date.now()}`;
    }

    console.log("Uploading ref:", ref, "has photo1:", !!photo1);

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
          "REF": ref,
          "Photo 1": photo1,
          "Photo 2": photo2,
          "Photo 3": photo3,
        }]
      })
    });

    const text = await res.text();
    console.log("AppSheet response:", res.status, text.slice(0,1000));

    if (!res.ok) throw new Error(text);

    return Response.json({ success: true, ref });
  } catch (e) {
    console.error("ERROR:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

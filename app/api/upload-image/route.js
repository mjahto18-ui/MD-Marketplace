const APP_ID = process.env.APPSHEET_APP_ID;
const API_KEY = process.env.APPSHEET_API_KEY;

export async function POST(req) {
  try {
    const form = await req.formData();

    async function toBase64(fieldName) {
      const file = form.get(fieldName);
      if (!file || typeof file === 'string') return "";
      const buffer = Buffer.from(await file.arrayBuffer());
      return `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    // بيجرب يلاقي الصور بأي اسم
    const photo1 = await toBase64("photo1") || await toBase64("file") || await toBase64("Photo 1") || "";
    const photo2 = await toBase64("photo2") || await toBase64("file2") || await toBase64("Photo 2") || "";
    const photo3 = await toBase64("photo3") || await toBase64("file3") || await toBase64("Photo 3") || "";

    if (!photo1 && !photo2 && !photo3) throw new Error("No photos found");

    const newCaseId = `REF-${String(Date.now()).slice(-6)}`;

    console.log("Uploading 3 photos:", !!photo1, !!photo2, !!photo3);

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
          "Photo 1": photo1,
          "Photo 2": photo2,
          "Photo 3": photo3,
          "Status": "Pending"
        }]
      })
    });

    const text = await res.text();
    console.log("AppSheet:", res.status, text);
    if (!res.ok) throw new Error(text);

    return Response.json({ success: true, caseId: newCaseId });
  } catch (e) {
    console.error("ERROR:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

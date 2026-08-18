const APP_ID = process.env.APPSHEET_APP_ID;
const API_KEY = process.env.APPSHEET_API_KEY;

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let photo1 = "", photo2 = "", photo3 = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        photo1 = `data:${file.type};base64,${buffer.toString("base64")}`;
      }
    } else {
      const data = await req.json();
      photo1 = data.photo1 || data.imageFile || "";
      photo2 = data.photo2 || "";
      photo3 = data.photo3 || "";
    }

    // بنعمل Case ID جديد
    const newCaseId = `REF-${String(Date.now()).slice(-6)}`;

    console.log("Uploading Case ID:", newCaseId);

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
          "Customer ID": "Mouhamad jahto",
          "Case Type": "متجر تالف",
          "Description": "test upload",
          "Photo 1": photo1,
          "Photo 2": photo2,
          "Photo 3": photo3,
          "Status": "Pending",
          "WhatsApp Chat": "03177653"
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

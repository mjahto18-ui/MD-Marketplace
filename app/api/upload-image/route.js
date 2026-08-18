import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    const res = await drive.files.create({
      requestBody: { name: `prot_${Date.now()}_${file.name}` },
      media: { mimeType: file.type, body: Readable.from(buffer) },
      fields: "id",
    });

    await drive.permissions.create({
      fileId: res.data.id,
      requestBody: { role: "reader", type: "anyone" },
    });

    return NextResponse.json({ url: `https://drive.google.com/uc?export=view&id=${res.data.id}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

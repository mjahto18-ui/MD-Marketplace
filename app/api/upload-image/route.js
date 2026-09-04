export async function POST(req) {
  try {
    const form = await req.formData();

    async function toBase64(name) {
      const f = form.get(name);
      if (!f || typeof f === 'string') return "";
      const buf = Buffer.from(await f.arrayBuffer());
      return `data:${f.type};base64,${buf.toString("base64")}`;
    }

    const photo1 = await toBase64("photo1") || await toBase64("file") || "";
    const photo2 = await toBase64("photo2") || await toBase64("file2") || "";
    const photo3 = await toBase64("photo3") || await toBase64("file3") || "";

    return Response.json({ 
      success: true, 
      photo1, 
      photo2, 
      photo3,
      url: photo1
    });
  } catch (e) {
    console.error("Upload error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

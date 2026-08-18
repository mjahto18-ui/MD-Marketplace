export async function POST(req) {
  try {
    const form = await req.formData();
    
    async function toBase64(name) {
      const file = form.get(name);
      if (!file || typeof file === 'string') return null;
      const buf = Buffer.from(await file.arrayBuffer());
      return `data:${file.type};base64,${buf.toString("base64")}`;
    }

    const photo1 = await toBase64("photo1") || await toBase64("file");
    const photo2 = await toBase64("photo2") || await toBase64("file2");
    const photo3 = await toBase64("photo3") || await toBase64("file3");

    // بيرجع الصور للفرونت، والفرونت بيبعتا مع باقي المعلومات على /api/protection-cases
    return Response.json({ 
      success: true, 
      photo1,
      photo2,
      photo3,
      url: photo1 // مشان اذا الفرونت القديم بيقرا url
    });
  } catch (e) {
    console.error("Upload error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

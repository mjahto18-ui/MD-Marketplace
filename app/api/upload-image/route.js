export async function POST(req) {
  try {
    const form = await req.formData();
    
    const res = await fetch("https://md-uploads.mjahto18-454.workers.dev/", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(t);
    }

    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

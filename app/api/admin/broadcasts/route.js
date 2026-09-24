import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url) {
    throw new Error("Missing env NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!key) {
    throw new Error("Missing env SUPABASE_SERVICE_KEY");
  }

  return createClient(url, key);
}

export async function POST(req) {
  console.log("[/api/admin/broadcasts] POST called");

  try {
    const body = await req.json();
    console.log("[/api/admin/broadcasts] body:", body);

    const title = body.title;
    const message = body.message;
    const audience = body.audience;
    const areaIds = body.areaIds;
    const storeId = body.storeId;
    const productId = body.productId;
    const price = body.price;
    const image = body.image;
    const btnText = body.btnText;
    const deepLink = body.deepLink;
    const schedule = body.schedule;

    if (!title || !message) {
      console.error("Validation failed: missing title/message");
      return Response.json(
        { ok: false, error: "Title و Message مطلوبين" },
        { status: 400 }
      );
    }

    if (!audience) {
      console.error("Validation failed: missing audience");
      return Response.json(
        { ok: false, error: "Audience مطلوب" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const payload = {
      "Title": title,
      "Message": message,
      "Audience": audience,
      "Area ID": areaIds && areaIds.length > 0 ? areaIds : null,
      "Store ID": storeId || null,
      "Product ID": productId || null,
      "Price": price || null,
      "Image URL": image || null,
      "Button Text": btnText || null,
      "Deep Link": deepLink || null,
      "Schedule At": schedule ? new Date(schedule).toISOString() : null,
      "Status": "Pending",
      "Created At": new Date().toISOString(),
    };

    console.log("[/api/admin/broadcasts] inserting payload:", payload);

    const result = await supabase
      .from("broadcast")
      .insert(payload)
      .select()
      .single();

    if (result.error) {
      console.error("[/api/admin/broadcasts] Supabase insert error:", result.error);
      console.error("Error details:", JSON.stringify(result.error, null, 2));

      return Response.json(
        {
          ok: false,
          error: result.error.message,
          details: result.error,
          code: result.error.code,
          hint: result.error.hint,
        },
        { status: 400 }
      );
    }

    console.log("[/api/admin/broadcasts] inserted:", result.data?.["Broadcast ID"]);

    return Response.json({
      ok: true,
      id: result.data?.["Broadcast ID"],
      data: result.data,
    });

  } catch (err) {
    console.error("[/api/admin/broadcasts] UNEXPECTED ERROR:", err);
    console.error(err?.stack);

    return Response.json(
      {
        ok: false,
        error: err?.message || "Unexpected server error",
        stack: err?.stack,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const result = await supabase
      .from("broadcast")
      .select("*")
      .order("Created At", { ascending: false })
      .limit(100);

    if (result.error) {
      console.error("[/api/admin/broadcasts] GET error:", result.error);
      return Response.json({ ok: false, error: result.error.message }, { status: 500 });
    }

    return Response.json({ ok: true, data: result.data });

  } catch (err) {
    console.error("[/api/admin/broadcasts] GET unexpected error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

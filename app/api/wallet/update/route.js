import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleAuth } from "google-auth-library";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const rawPhone = String(body.phone || body.customerPhone || "").trim();
    const customerID = String(body.customerID || "").trim();
    if (!rawPhone && !customerID) {
      return NextResponse.json({ success: false, error: "phone required" });
    }

    const cleanPhone = rawPhone.replace(/[^0-9]/g, "").replace(/^961/, "").replace(/^0+/, "");
    const supabase = getSupabase();

    // 1 - جيب Customer ID من التلفون اذا ما اجا
    let custId = customerID;
    let customerRow = null;
    if (!custId && cleanPhone) {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .or(`Mobile.eq.${cleanPhone},Mobile.eq.0${cleanPhone},Mobile.eq.961${cleanPhone}`)
        .maybeSingle();
      customerRow = data;
      custId = String(data?.["Customer ID"] || data?.id || "");
    }
    if (!custId && customerRow) {
      custId = String(customerRow["Customer ID"] || "");
    }

    // 2 - جيب نقاطي و محفظتي - متل my-balance بالضبط
    let points = 0;
    let wallet = 0;
    let freeRemaining = 5;

    if (custId) {
      const { data: rewardRow } = await supabase
        .from("rewards")
        .select('"Bonus Balance"')
        .eq("Customer ID", custId)
        .order("Transaction Date", { ascending: false })
        .order("supa_id", { ascending: false })
        .limit(1)
        .maybeSingle();
      points = Number(rewardRow?.["Bonus Balance"] || 0);
    }

    if (customerRow && customerRow["Free Delivery"] != null) {
      freeRemaining = Number(customerRow["Free Delivery"] || 0);
    } else if (custId) {
      const { data: c2 } = await supabase
        .from("customers")
        .select('"Free Delivery"')
        .eq("Customer ID", custId)
        .maybeSingle();
      if (c2) freeRemaining = Number(c2["Free Delivery"] || 0);
    }

    // محفظتي - من wallet_transactions
    if (custId) {
      const { data: userRow } = await supabase
        .from("users")
        .select('"User ID"')
        .eq("Customer ID", custId)
        .maybeSingle();
      const ownerUserId = userRow?.["User ID"] || custId;
      const { data: walletRow } = await supabase
        .from("wallet_transactions")
        .select('"Balance After"')
        .eq("Owner User ID", ownerUserId)
        .order("Created At", { ascending: false })
        .order("supa_id", { ascending: false })
        .limit(1)
        .maybeSingle();
      wallet = Number(walletRow?.["Balance After"] || 0);
    }

    // 3 - ابعت لـ Google - تحديث نفس الكرت
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || "3388000000023248405";
    const objectId = `${issuerId}.md_loyalty_${cleanPhone}`;

    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const patchBody = {
      loyaltyPoints: {
        label: "Points",
        balance: { string: String(points) },
      },
      accountName: {
        value: `Wallet: ${wallet} L.L | Free Delivery: ${freeRemaining}`,
      },
    };

    const res = await fetch(
      `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patchBody),
      }
    );

    const resJson = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("WALLET UPDATE ERROR:", resJson);
      return NextResponse.json({ success: false, error: resJson, points, wallet, freeRemaining });
    }

    return NextResponse.json({ success: true, points, wallet, freeRemaining, objectId });
  } catch (e) {
    console.error("WALLET UPDATE ERROR:", e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

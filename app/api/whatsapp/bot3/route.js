import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { getPricingConfig, calculateFare } from "@/lib/taxi/pricingEngine";

export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mjahto123";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1183824331491327";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.md-marketplace.store";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function normalizeWhatsAppNumber(phone) {
  let c = String(phone || "").replace(/\D/g, "");
  if (!c) return null;
  if (c.startsWith("961")) return c;
  if (c.startsWith("966")) return c;
  if (c.startsWith("0")) c = c.substring(1);
  if (c.length === 9 && c.startsWith("5")) return "966" + c;
  if (c.length === 10 && c.startsWith("5")) return "966" + c;
  if (c.length === 7 && c.startsWith("3")) return "961" + c;
  if (c.length === 8) return "961" + c;
  return c;
}
function normalizePhone(p) { return String(p || "").replace(/\D/g, "").trim(); }
function normalizeText(t) { return String(t||"").toLowerCase().trim(); }

async function sendMessage(to, text) {
  if (!WHATSAPP_TOKEN) return;
  const cleanPhone = normalizeWhatsAppNumber(to);
  try {
    const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: cleanPhone, type: "text", text: { body: text } })
    });
    const data = await res.json();
    console.log("📤 WhatsApp BOT3:", JSON.stringify(data).slice(0,500));
  } catch(e){ console.error("BOT3 send error", e); }
}

// ---- Bot Sessions متل BOT2 ----
async function getBotSessionRow(phone) {
  const supabase = getSupabase();
  const { data } = await supabase.from('bot_sessions').select('*').eq('Phone', normalizeWhatsAppNumber(phone)).order('Last Activity', { ascending: false }).limit(1);
  return data?.[0] || null;
}
async function touchBotSession(phone) {
  const supabase = getSupabase();
  await supabase.from('bot_sessions').update({ "Last Activity": new Date().toISOString() }).eq('Phone', normalizeWhatsAppNumber(phone));
}
async function closeBotSessionAndReturnToBot1(phone, reason="TAXI_DONE") {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  console.log(`🔒 تسكير BOT3 لـ ${phone} سبب: ${reason} -> BOT1`);
  await supabase.from('bot_sessions').update({ "Active Bot": "BOT1", Status: "CLOSED", "Closed At": now, "Last Activity": now }).eq('Phone', normalizeWhatsAppNumber(phone));
}
async function createOrUpdateBot3Session(phone, dataPatch={}) {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const norm = normalizeWhatsAppNumber(phone);
  const existing = await getBotSessionRow(phone);
  const base = { Phone: norm, "Active Bot": "BOT3_TAXI", Status: "ACTIVE", "Started At": existing?.["Started At"] || now, "Last Activity": now, "Request ID": existing?.["Request ID"] || "" };
  const mergedData = {...(existing?.data || {}),...dataPatch };
  if (existing) {
    // مجبر يعدل بس بالسطر اللي مربوط بالرقم Phone هو المفتاح
    await supabase.from('bot_sessions').update({...base, data: mergedData }).eq('Phone', norm);
  } else {
    await supabase.from('bot_sessions').insert([{...base, data: mergedData, "Closed At": "" }]);
  }
  return mergedData;
}

// ---- جلب بيانات العميل - البحث الوحيد هو الرقم ----
// ملاحظة: من واتساب بيجي الرقم كامل 966551653968
// لازم نقارنو مع WhatsApp Number لانو كامل متلو متل الواتساب
async function getCustomerByPhone(phone) {
  const supabase = getSupabase();
  const phoneW = normalizeWhatsAppNumber(phone);
  const { data: customers } = await supabase.from('customers').select('*');
  for (const c of customers || []) {
    const mobileW = normalizeWhatsAppNumber(c["Mobile"] || "");
    if (mobileW === phoneW) return c;
  }
  return null;
}
async function getUserTaxiStatus(phone) {
  const supabase = getSupabase();
  const phoneW = normalizeWhatsAppNumber(phone);
  if (!phoneW) return null;
  const { data: usersRows } = await supabase.from('users').select('*');
  for (const u of usersRows || []) {
    const waNum = normalizeWhatsAppNumber(u['WhatsApp Number'] || '');
    if (waNum && waNum === phoneW) return u; // بس واتس نمبر كامل
  }
  return null;
}

function getEstimateEngineCode(vehicle_type, bundle) {
  const engines = bundle?.engines? Object.values(bundle.engines) : [];
  if (vehicle_type === 'moto') {
    const f = engines.filter(e => e.vehicle_type === 'moto' || e.code === '150'); f.sort((a,b)=>Number(b.factor)-Number(a.factor)); return f[0]?.code || '150';
  }
  if (vehicle_type === 'toktok' || vehicle_type === 'tuk') {
    const f = engines.filter(e => e.vehicle_type === 'toktok' || e.code === '200'); f.sort((a,b)=>Number(b.factor)-Number(a.factor)); return f[0]?.code || '200';
  }
  const f = engines.filter(e => e.vehicle_type === 'car'); f.sort((a,b)=>Number(b.factor)-Number(a.factor)); return f[0]?.code || '2500';
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (body.command === "START_TAXI" || body.transferKey === "START_TAXI" || body.event === "NEW_TAXI") {
      const bridgePhone = normalizeWhatsAppNumber(body.phone || body.Phone || body.from || "");
      if (!bridgePhone) return NextResponse.json({ status: "ok", error: "NO_PHONE" });
      console.log(`🚀 BOT3 Bridge START_TAXI: ${bridgePhone} | وقائع فيرسيل لوج تنمحى بعد ساعة`);
      await createOrUpdateBot3Session(bridgePhone, {});
      const startMsg = body.startMessage || "تكرم عينك 🚕 من وين بدك نبلش؟\nبعتلي موقعك الحالي 📍";
      await sendMessage(bridgePhone, startMsg);
      return NextResponse.json({ status: "ok", bridge: "BOT3_STARTED", phone: bridgePhone });
    }

    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const from = message?.from || body?.from || "";
    if (!from) return NextResponse.json({ status: "ok" });

    const whatsappNumber = normalizeWhatsAppNumber(from);
    const session = await getBotSessionRow(whatsappNumber);
    if (!session || session["Active Bot"]!== "BOT3_TAXI" || session.Status!== "ACTIVE") {
      return NextResponse.json({ status: "ok", action: "NOT_BOT3" });
    }

    await touchBotSession(whatsappNumber);

    const customerRow = await getCustomerByPhone(whatsappNumber);
    const userRow = await getUserTaxiStatus(whatsappNumber);

    if (!customerRow) {
      await sendMessage(whatsappNumber, "ما لقيت حسابك بجدول العملاء، لازم تسجل اول شي على md-marketplace.store");
      return NextResponse.json({ status: "ok" });
    }

    const taxiFlag = userRow?.taxi;
    if (taxiFlag === null || taxiFlag === undefined || String(taxiFlag).trim() === "") {
      await sendMessage(whatsappNumber, "خدمة التاكسي مش متاحة لحسابك حاليا 🙏");
      console.log(`🚫 TAXI null/مش متاحة لـ ${whatsappNumber} - WhatsApp Number: ${userRow?.["WhatsApp Number"]}`);
      await closeBotSessionAndReturnToBot1(whatsappNumber, "TAXI_NULL_NOT_AVAILABLE");
      return NextResponse.json({ status: "ok", taxi: "null_not_available" });
    }
    if (String(taxiFlag).toLowerCase() === "no") {
      await sendMessage(whatsappNumber, "🔒 خدمة MD-TAXI موقفة لحسابك");
      console.log(`🚫 TAXI no/محظور لـ ${whatsappNumber}`);
      await closeBotSessionAndReturnToBot1(whatsappNumber, "TAXI_NO_BLOCKED");
      return NextResponse.json({ status: "ok", taxi: "no_blocked" });
    }

    const customer_id = customerRow["Customer ID"]?.toString();
    const customer_name = customerRow["Name"] || customerRow["Customer Name"] || "";
    const customer_phone = customerRow["Mobile"] || from;

    const text = message?.text?.body || body?.text || "";
    const loc = message?.location || null;

    let currentData = session?.data || {};

    if (loc && loc.latitude && loc.longitude) {
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      const name = loc.name || loc.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      const address = loc.address || name;

      if (!currentData.origin_lat) {
        console.log(`📍 BOT3 ORIGIN ${whatsappNumber} => lat=${lat} lng=${lng} name=${name}`);
        currentData = await createOrUpdateBot3Session(whatsappNumber, { origin_lat: lat, origin_lng: lng, origin_name: name, origin_address: address });
        await sendMessage(whatsappNumber, `تمام لقطت موقعك من: ${name} ✅\n\nهلا لوين؟ فوت اعمل بحث واتساب و بعتلي الموقع التاني  📍`);
        return NextResponse.json({ status: "ok", step: "ORIGIN_SAVED" });
      } else if (!currentData.dest_lat) {
        console.log(`📍 BOT3 DEST ${whatsappNumber} => lat=${lat} lng=${lng} name=${name}`);
        currentData = await createOrUpdateBot3Session(whatsappNumber, { dest_lat: lat, dest_lng: lng, dest_name: name, dest_address: address });
        await sendMessage(whatsappNumber, `ممتاز! من ${currentData.origin_name} الى ${name} ✅\n\nيرجى تحديد نوع الالية:\n1⃣ موتو\n2⃣ سيارة\n3⃣ توكتوك\n\nاكتب: موتو او سيارة او توكتوك`);
        return NextResponse.json({ status: "ok", step: "DEST_SAVED" });
      }
    }

    if (currentData.origin_lat && currentData.dest_lat && text) {
      const t = normalizeText(text);
      let vehicle_type = null;
      if (t.includes("موتو") || t.includes("moto") || t === "1") vehicle_type = "moto";
      else if (t.includes("سيارة") || t.includes("car") || t === "2") vehicle_type = "car";
      else if (t.includes("توك") || t.includes("tuk") || t.includes("toktok") || t === "3") vehicle_type = "toktok";

      if (!vehicle_type) {
        await sendMessage(whatsappNumber, "ما فهمت نوع الالية، اكتب: موتو / سيارة / توكتوك");
        return NextResponse.json({ status: "ok", step: "WAIT_VEHICLE" });
      }

      const bundle = await getPricingConfig();
      const engineCode = getEstimateEngineCode(vehicle_type, bundle);
      const R = 6371;
      const dLat = (currentData.dest_lat - currentData.origin_lat) * Math.PI/180;
      const dLng = (currentData.dest_lng - currentData.origin_lng) * Math.PI/180;
      const a = Math.sin(dLat/2)**2 + Math.cos(currentData.origin_lat*Math.PI/180)*Math.cos(currentData.dest_lat*Math.PI/180)*Math.sin(dLng/2)**2;
      const totalKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const fare = calculateFare({
        cityKm: totalKm, highwayKm: 0, totalKm: totalKm,
        engineCode: engineCode, area: 'default', vehicle_type: vehicle_type,
        routeKey: 'default', pricingBundle: bundle, isDriverAcceptance: false
      });

      const supabase = getSupabase();
      const { data: orderData, error } = await supabase.from('taxi_orders').insert({
        customer_id: customer_id,
        customer_name: customer_name,
        customer_phone: customer_phone,
        origin_name: currentData.origin_name,
        origin_lat: Number(currentData.origin_lat),
        origin_lng: Number(currentData.origin_lng),
        dest_name: currentData.dest_name,
        dest_lat: Number(currentData.dest_lat),
        dest_lng: Number(currentData.dest_lng),
        taxi_vehicle_type: vehicle_type,
        taxi_engine_cc: null,
        status: 'draft',
        total_amount: fare.customer_pays_lbp,
        distance_traveled: Number(totalKm) || 0,
        customer_notes: `BOT3_TAXI pricing: ${JSON.stringify(fare.breakdown)} engine:${engineCode} | origin: ${currentData.origin_name} -> dest: ${currentData.dest_name}`,
        customer_lat: Number(currentData.origin_lat),
        customer_lng: Number(currentData.origin_lng),
      }).select().single();

      if (error) {
        console.error("BOT3 insert taxi_orders error", error);
        await sendMessage(whatsappNumber, "صار خطأ بتسجيل الطلب، جرب مرة تانية 🙏");
        return NextResponse.json({ status: "ok", error: error.message });
      }

      const tripCode = orderData.id? `TAXI-${String(orderData.id).slice(0,5).toUpperCase()}` : `TAXI-${Date.now().toString().slice(-5)}`;
      const reply = `✅ تم تسجيل طلبك!\n\n📍 من: ${currentData.origin_name}\n📍 الى: ${currentData.dest_name}\n🚗 الالية: ${vehicle_type}\n📏 المسافة: ${totalKm.toFixed(2)} كم\n💰 السعر التقريبي: ${fare.customer_pays_lbp?.toLocaleString()} ل.ل\n\n📌 كود الرحلة: *${tripCode}*\n⏳ بانتظار سائق قريب...\n\nتابع رحلتك من هون:\n${SITE_URL}/taxi\n\nفوت بحسابك وشوف حالة الطلب 🚕`;

      await sendMessage(whatsappNumber, reply);
      console.log(`✅ BOT3 ORDER CREATED ${tripCode}`);
      await closeBotSessionAndReturnToBot1(whatsappNumber, "TAXI_ORDER_DONE");
      return NextResponse.json({ status: "ok", action: "TAXI_DRAFT_CREATED", tripCode });
    }

    if (!currentData.origin_lat) {
      await sendMessage(whatsappNumber, "بعتلي موقعك الحالي 📍 من وين بدك نبلش؟");
    } else if (!currentData.dest_lat) {
      await sendMessage(whatsappNumber, "هلا لوين؟ بعتلي الموقع التاني بالبحث 📍");
    }

    return NextResponse.json({ status: "ok" });
  } catch (e) {
    console.error("❌ BOT3 POST Error:", e);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}

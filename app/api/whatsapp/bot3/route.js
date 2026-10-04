import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { getPricingConfig, calculateFare } from "@/lib/taxi/pricingEngine";
import { getNearbyDrivers } from "@/lib/taxi/nearby";

export const dynamic = "force-dynamic";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1183824331491327";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.md-marketplace.store";
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mjahto123";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}
function normalize(phone) {
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
function normalizeText(t){ return String(t||"").toLowerCase().trim(); }

async function sendMessage(to, text){
  const cleanPhone = normalize(to);
  try{
    await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`,{
      method:"POST",
      headers:{ Authorization:`Bearer ${WHATSAPP_TOKEN}`, "Content-Type":"application/json"},
      body:JSON.stringify({ messaging_product:"whatsapp", to:cleanPhone, type:"text", text:{body:text}})
    })
  }catch(e){}
}
async function sendTaxiButton(to, detailsText){
  const cleanPhone = normalize(to);
  const taxiUrl = `${SITE_URL}/taxi`;
  try{
    const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`,{
      method:"POST",
      headers:{ Authorization:`Bearer ${WHATSAPP_TOKEN}`, "Content-Type":"application/json"},
      body:JSON.stringify({
        messaging_product:"whatsapp", to:cleanPhone, type:"interactive",
        interactive:{ type:"cta_url", body:{text:detailsText.slice(0,1024)}, action:{name:"cta_url", parameters:{display_text:"🚕 تابع رحلتك", url:taxiUrl}} }
      })
    });
    if(!res.ok) await sendMessage(to, detailsText+`\n\n${taxiUrl}`);
  }catch{ await sendMessage(to, detailsText+`\n\n${taxiUrl}`); }
}

async function getBotSessionRow(phone){
  const supabase = getSupabase();
  const {data} = await supabase.from('bot_sessions').select('*').eq('Phone', normalize(phone)).order('Last Activity',{ascending:false}).limit(1);
  return data?.[0]||null;
}
async function touchBotSession(phone){
  const supabase = getSupabase();
  await supabase.from('bot_sessions').update({"Last Activity":new Date().toISOString()}).eq('Phone', normalize(phone)).eq('Active Bot','BOT3_TAXI');
}
async function closeBotSessionAndReturnToBot1(phone, reason="TAXI_DONE"){
  const supabase = getSupabase();
  const now = new Date().toISOString();
  await supabase.from('bot_sessions').update({"Active Bot":"BOT1", Status:"CLOSED", "Closed At":now, "Last Activity":now, data:null}).eq('Phone', normalize(phone));
}
async function createOrUpdateBot3Session(phone, dataPatch={}){
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const norm = normalize(phone);
  const existing = await getBotSessionRow(phone);
  const base = { Phone:norm, "Active Bot":"BOT3_TAXI", Status:"ACTIVE", "Started At":existing?.["Started At"]||now, "Last Activity":now, "Request ID":existing?.["Request ID"]||"" };
  const mergedData = {...(existing?.data||{}),...dataPatch };
  if(existing){
    await supabase.from('bot_sessions').update({...base, data:mergedData}).eq('Phone', norm);
  }else{
    await supabase.from('bot_sessions').insert([{...base, data:mergedData, "Closed At":""}]);
  }
  return mergedData;
}

// فحص خفيف بيستعمل الـ index - مش select *
async function getUserTaxiStatusFast(phone){
  const supabase = getSupabase();
  const norm = normalize(phone);
  // بيستعمل idx_users_whatsapp_number
  const {data} = await supabase.from('users').select('"Customer ID", "Name", taxi, "Mobile", "WhatsApp Number"').eq('"WhatsApp Number"', norm).maybeSingle();
  if(data) return data;
  // fallback mobile
  const {data: data2} = await supabase.from('users').select('"Customer ID", "Name", taxi, "Mobile", "WhatsApp Number"').eq('"Mobile"', norm).maybeSingle();
  return data2||null;
}
async function getCustomerFast(customerId){
  const supabase = getSupabase();
  const {data} = await supabase.from('customers').select('"Customer ID", "Name", "Mobile"').eq('"Customer ID"', customerId).maybeSingle();
  return data||null;
}
async function getNextWhatsAppOrderCode(){
  const supabase = getSupabase();
  const {data} = await supabase.from('taxi_orders').select('order_code').ilike('order_code','MD-W%').order('created_at',{ascending:false}).limit(1);
  let nextNum=1;
  if(data?.[0]?.order_code){
    const m=data[0].order_code.match(/MD-W(\d+)/);
    if(m) nextNum=parseInt(m[1],10)+1;
  }
  return `MD-W${String(nextNum).padStart(5,'0')}`;
}
function getEstimateEngineCode(vehicle_type, bundle){
  const engines = bundle?.engines? Object.values(bundle.engines) : [];
  if(vehicle_type==='moto'){ const f=engines.filter(e=>e.vehicle_type==='moto'||e.code==='150'); f.sort((a,b)=>Number(b.factor)-Number(a.factor)); return f[0]?.code||'150'; }
  if(vehicle_type==='toktok'){ const f=engines.filter(e=>e.vehicle_type==='toktok'||e.code==='200'); f.sort((a,b)=>Number(b.factor)-Number(a.factor)); return f[0]?.code||'200'; }
  const f=engines.filter(e=>e.vehicle_type==='car'); f.sort((a,b)=>Number(b.factor)-Number(a.factor)); return f[0]?.code||'2500';
}

export async function GET(req){
  const {searchParams}=new URL(req.url);
  if(searchParams.get("hub.mode")==="subscribe" && searchParams.get("hub.verify_token")===VERIFY_TOKEN) return new Response(searchParams.get("hub.challenge"),{status:200});
  return new Response("Forbidden",{status:403});
}

export async function POST(req){
  try{
    const body = await req.json();

    // بداية من بوت1
    if(body.command==="START_TAXI" || body.transferKey==="START_TAXI" || body.event==="NEW_TAXI"){
      const bridgePhone = normalize(body.phone||body.Phone||body.from||"");
      if(!bridgePhone) return NextResponse.json({status:"ok", error:"NO_PHONE"});
      // خزن بيانات الزبون يلي جاية من بوت1
      const userFromBot1 = body.user||{};
      await createOrUpdateBot3Session(bridgePhone, {
        customer_id: userFromBot1.customerId||"",
        customer_name: userFromBot1.name||"",
        customer_phone: bridgePhone
      });
      await sendMessage(bridgePhone, body.startMessage||"تكرم عينك 🚕 من وين بدك نبلش؟\nإرسال موقعك الحالي 📍");
      return NextResponse.json({status:"ok", bridge:"BOT3_STARTED"});
    }

    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const from = message?.from || body?.from || "";
    if(!from) return NextResponse.json({status:"ok"});
    const whatsappNumber = normalize(from);
    const session = await getBotSessionRow(whatsappNumber);
    if(!session || session["Active Bot"]!=="BOT3_TAXI" || session.Status!=="ACTIVE") return NextResponse.json({status:"ok", action:"NOT_BOT3"});
    await touchBotSession(whatsappNumber);

    // فحص خفيف (optional) - بيستعمل index
    const userRow = await getUserTaxiStatusFast(whatsappNumber);
    if(!userRow?.["Customer ID"]){
      await sendMessage(whatsappNumber, "ما لقيت Customer ID بحسابك، لازم تسجل كزبون على md-marketplace.store 🙏");
      await closeBotSessionAndReturnToBot1(whatsappNumber,"NO_CUSTOMER_ID");
      return NextResponse.json({status:"ok", taxi:"no_customer_id"});
    }
    const taxiFlag = userRow?.taxi;
    if(taxiFlag===null||taxiFlag===undefined||String(taxiFlag).trim()===""){
      await sendMessage(whatsappNumber, "خدمة التاكسي مش متاحة لحسابك حاليا 🙏");
      await closeBotSessionAndReturnToBot1(whatsappNumber,"TAXI_NULL");
      return NextResponse.json({status:"ok"});
    }
    if(String(taxiFlag).toLowerCase()==="no"){
      await sendMessage(whatsappNumber, "🔒 خدمة MD-TAXI موقفة لحسابك");
      await closeBotSessionAndReturnToBot1(whatsappNumber,"TAXI_NO");
      return NextResponse.json({status:"ok"});
    }

    const text = message?.text?.body || body?.text || "";
    const loc = message?.location || null;
    let currentData = session?.data || {};

    // === حالة جديدة: ناطر موافقة على السعر ===
    if(currentData.awaiting_confirm){
      const t = normalizeText(text);
      const isYes = ["نعم","yes","ok","اي","ايه","تمام","موافق","اكيد","1"].includes(t);
      const isNo = ["لا","no","الغاء","إلغاء","cancel","2"].includes(t);

      if(isNo){
        await sendMessage(whatsappNumber, "تم إلغاء الطلب 👍 بتحب نبلش من جديد؟ بعتلي موقعك 📍");
        await createOrUpdateBot3Session(whatsappNumber, { awaiting_confirm:false, pending_fare:null, pending_km:null, pending_vehicle:null, pending_engine:null, origin_lat:null, origin_lng:null, dest_lat:null, dest_lng:null });
        return NextResponse.json({status:"ok", action:"CANCELLED"});
      }

      if(isYes){
        // هون بس منعمل INSERT - بعد ما وافق على السعر
        const supabase = getSupabase();
        const nextOrderCode = await getNextWhatsAppOrderCode();
        const secretCode = String(Math.floor(1000 + Math.random()*9000));
        const customer_id = currentData.customer_id || userRow["Customer ID"];
        const customer_name = currentData.customer_name || userRow["Name"] || "";

        const {data: orderData, error} = await supabase.from('taxi_orders').insert({
          order_code: nextOrderCode,
          customer_id: customer_id,
          customer_name: customer_name,
          customer_phone: whatsappNumber,
          origin_name: currentData.origin_name,
          origin_lat: Number(currentData.origin_lat),
          origin_lng: Number(currentData.origin_lng),
          dest_name: currentData.dest_name,
          dest_lat: Number(currentData.dest_lat),
          dest_lng: Number(currentData.dest_lng),
          taxi_vehicle_type: currentData.pending_vehicle,
          status:'pending',
          total_amount: currentData.pending_fare,
          distance_traveled: Number(currentData.pending_km)||0,
          customer_notes: `BOT3 pricing: engine:${currentData.pending_engine} | ${currentData.origin_name} -> ${currentData.dest_name}`,
          customer_lat: Number(currentData.origin_lat),
          customer_lng: Number(currentData.origin_lng),
          secret_code: secretCode,
          is_code_verified:false,
        }).select().single();

        if(error){
          await sendMessage(whatsappNumber, "صار خطأ بتسجيل الطلب، جرب مرة تانية 🙏");
          return NextResponse.json({status:"ok", error:error.message});
        }

        // نبه الشوفيرية
        try{
          let nearby = await getNearbyDrivers(supabase, { origin_lat:orderData.origin_lat, origin_lng:orderData.origin_lng, vehicle_type:orderData.taxi_vehicle_type, radiusKm:5 });
          if(nearby.length===0) nearby = await getNearbyDrivers(supabase, { origin_lat:orderData.origin_lat, origin_lng:orderData.origin_lng, vehicle_type:orderData.taxi_vehicle_type, radiusKm:10 });
          if(nearby.length>0){
            const pushRows = nearby.map(d=>({
              Title:'طلب تاكسي جديد قريب منك',
              Message:`${orderData.origin_name} -> ${orderData.dest_name} - ${orderData.taxi_vehicle_type} - ${orderData.total_amount?.toLocaleString()} ل.ل - ${d.distance_km.toFixed(1)} كم - كود:${secretCode}`,
              Status:'Pending', Code:'TAXI_NEW_REQUEST', 'Order ID':orderData.id, 'Customer ID':d.Taxi_ID
            }));
            await supabase.from('push_queue').insert(pushRows);
          }
        }catch(e){}

        const detailsText = `✅ تم تأكيد طلبك!\n\n📍 من: ${currentData.origin_name}\n📍 الى: ${currentData.dest_name}\n🚗 الالية: ${currentData.pending_vehicle}\n📏 المسافة: ${Number(currentData.pending_km).toFixed(2)} كم\n💰 السعر: ${Number(currentData.pending_fare).toLocaleString()} ل.ل\n\n📌 كود: ${orderData.order_code}\n🔒 رمز: ${secretCode}\n⏳ بانتظار سائق...`;
        await sendTaxiButton(whatsappNumber, detailsText);
        await closeBotSessionAndReturnToBot1(whatsappNumber,"TAXI_ORDER_DONE");
        return NextResponse.json({status:"ok", action:"TAXI_CREATED"});
      }else{
        await sendMessage(whatsappNumber, "ما فهمت، اكتب *نعم* للموافقة على السعر او *لا* للإلغاء");
        return NextResponse.json({status:"ok", action:"WAIT_CONFIRM"});
      }
    }

    if(loc?.latitude && loc?.longitude){
      const lat=Number(loc.latitude), lng=Number(loc.longitude);
      const name=loc.name||loc.address||`${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      if(!currentData.origin_lat){
        currentData = await createOrUpdateBot3Session(whatsappNumber, { origin_lat:lat, origin_lng:lng, origin_name:name });
        await sendMessage(whatsappNumber, `تمام لقطت موقعك من: ${name} ✅\n\nنقطة الوصول إرسال الموقع التاني 📍`);
        return NextResponse.json({status:"ok", step:"ORIGIN_SAVED"});
      }else if(!currentData.dest_lat){
        currentData = await createOrUpdateBot3Session(whatsappNumber, { dest_lat:lat, dest_lng:lng, dest_name:name });
        await sendMessage(whatsappNumber, `ممتاز! من ${currentData.origin_name} الى ${name} ✅\n\nيرجى تحديد نوع الالية:\n1⃣ موتو\n2⃣ سيارة\n3⃣ توكتوك\n\nاكتب: موتو او سيارة او توكتوك`);
        return NextResponse.json({status:"ok", step:"DEST_SAVED"});
      }
    }

    if(currentData.origin_lat && currentData.dest_lat && text){
      const t=normalizeText(text);
      let vehicle_type=null;
      if(t.includes("موتو")||t.includes("moto")||t==="1") vehicle_type="moto";
      else if(t.includes("سيارة")||t.includes("car")||t==="2") vehicle_type="car";
      else if(t.includes("توك")||t.includes("tuk")||t.includes("toktok")||t==="3") vehicle_type="toktok";
      if(!vehicle_type){
        await sendMessage(whatsappNumber, "ما فهمت نوع الالية، اكتب: موتو / سيارة / توكتوك");
        return NextResponse.json({status:"ok", step:"WAIT_VEHICLE"});
      }

      // احسب السعر بس لا تسجل بعد!
      const bundle = await getPricingConfig();
      const engineCode = getEstimateEngineCode(vehicle_type, bundle);
      const R=6371;
      const dLat=(currentData.dest_lat-currentData.origin_lat)*Math.PI/180;
      const dLng=(currentData.dest_lng-currentData.origin_lng)*Math.PI/180;
      const a=Math.sin(dLat/2)**2 + Math.cos(currentData.origin_lat*Math.PI/180)*Math.cos(currentData.dest_lat*Math.PI/180)*Math.sin(dLng/2)**2;
      const totalKm=R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const fare=calculateFare({ cityKm:totalKm, highwayKm:0, totalKm:totalKm, engineCode:engineCode, area:'default', vehicle_type:vehicle_type, routeKey:'default', pricingBundle:bundle, isDriverAcceptance:false });

      // خزن مؤقت واعرض السعر قبل الحجز
      await createOrUpdateBot3Session(whatsappNumber, {
        pending_vehicle:vehicle_type,
        pending_fare:fare.customer_pays_lbp,
        pending_km:totalKm,
        pending_engine:engineCode,
        awaiting_confirm:true
      });

      await sendMessage(whatsappNumber,
`💰 *السعر قبل الحجز:*
📍 من: ${currentData.origin_name}
📍 الى: ${currentData.dest_name}
🚗 الالية: ${vehicle_type}
📏 المسافة: ${totalKm.toFixed(2)} كم
💵 السعر: ${fare.customer_pays_lbp?.toLocaleString()} ل.ل

بتوافق على السعر؟
اكتب *نعم* للتأكيد ✅
او *لا* للإلغاء ❌`
      );
      return NextResponse.json({status:"ok", step:"PRICE_SHOWN_AWAITING_CONFIRM"});
    }

    if(!currentData.origin_lat) await sendMessage(whatsappNumber, "إرسال موقعك الحالي 📍 نقطة الإنطلاق");
    else if(!currentData.dest_lat) await sendMessage(whatsappNumber, "نقطة الوصول اختيار خانة بالبحث للإرسال📍");

    return NextResponse.json({status:"ok"});
  }catch(e){
    console.error("BOT3 POST Error:", e);
    return NextResponse.json({status:"ok"}, {status:200});
  }
}

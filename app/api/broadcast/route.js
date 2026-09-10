import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST() {
  const supabase = getSupabase();
  const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID
  const ONESIGNAL_KEY = process.env.ONESIGNAL_REST_KEY

  // 1. جيب كل البرودكاست اللي Pending ووقتو اجا
  const { data: broadcasts } = await supabase.from('broadcast').select('*').eq('Status','Pending').lte('Schedule At', new Date().toISOString())
  if (!broadcasts?.length) return NextResponse.json({msg:'No pending'})

  // 2. لف على كل برودكاست
  for (const b of broadcasts) {
    
    try {
      // متل السكريبت القديم: حط الحالة sending
      await supabase.from('broadcast').update({Status:'Sending'}).eq('Broadcast ID', b['Broadcast ID'])

      // 3. حضر فلتر المنطقة
      let areaIds = b['Area ID'] ? String(b['Area ID']).split(",").map(s => s.trim().toLowerCase()) : []
      let audience = String(b['Audience'] || "").toLowerCase().trim()

      // 4. جيب كل اليوزرز اللي عندن Subscription ID
      // ملاحظة: هون جبنا كل الاعمدة مشان نشيك active و status متل السكريبت القديم
      let { data: users } = await supabase.from('users').select('*').not('"Subscription ID"','is',null)

      let targetSubIds = [];

      // 5. فلترة اليوزرز - نفس منطق السكريبت القديم بالظبط
      for (const u of users || []) {
        let role = String(u['Role'] || "").toLowerCase()
        let userStatus = String(u['Status'] || "").toLowerCase()
        let userActive = u['Is Active'] // او Active حسب شو اسمو عندك
        let userArea = String(u['Area ID'] || "").toLowerCase().trim()
        let subId = u['Subscription ID']

        if (!subId) continue;

        // شيك active متل السكريبت القديم
        if (userActive !== true && String(userActive).toUpperCase() !== "TRUE") continue;
        
        // شيك status active متل السكريبت القديم
        if (userStatus !== "active") continue;

        // فلتر حسب الجمهور
        if (audience === "all") {
          targetSubIds.push(subId);
        } else if (audience === "customer" && role === "customer") {
          targetSubIds.push(subId);
        } else if (audience === "driver" && role === "driver") {
          targetSubIds.push(subId);
        } else if (audience === "store" && role.includes("store")) {
          targetSubIds.push(subId);
        } else if (audience === "area" && areaIds.includes(userArea)) {
          targetSubIds.push(subId);
        }
      }

      // 6. اذا ما لقيت حدا
      if (targetSubIds.length === 0) {
        throw new Error("ما لقيت حدا للارسال");
      }

      // 7. شيل التكرار - اذا نفس الشخص عندو جهازين
      targetSubIds = [...new Set(targetSubIds)];

      // 8. ابعت على دفعات كل دفعة 2000
      for (let i = 0; i < targetSubIds.length; i += 2000) {
        let chunk = targetSubIds.slice(i, i + 2000);
        await fetch('https://api.onesignal.com/notifications', {
          method:'POST',
          headers:{Authorization: `Key ${ONESIGNAL_KEY}`, 'Content-Type':'application/json'},
          body: JSON.stringify({ 
            app_id: ONESIGNAL_APP_ID, 
            include_subscription_ids: chunk, 
            headings: { en: b['Title'] }, 
            contents: { en: b['Message'] },
            big_picture: b['Image URL'] || undefined // من السكريبت القديم
          })
        })
      }

      // 9. متل السكريبت القديم: عمود 11 = sent و عمود 9 = Sent to X
      await supabase.from('broadcast').update({
        Status:'Sent',
        "Sent At": new Date().toISOString(),
        "Recipients": targetSubIds.length,
        "Sent Count": targetSubIds.length,
        "Button Text": "Sent to " + targetSubIds.length
      }).eq('Broadcast ID', b['Broadcast ID'])

    } catch (e) {
      // 10. اذا فشل - متل السكريبت القديم يكتب failed و يكتب السبب بعمود 9
      await supabase.from('broadcast').update({
        Status:'Failed',
        "Button Text": e.toString()
      }).eq('Broadcast ID', b['Broadcast ID'])
    }
  }

  return NextResponse.json({done:true})
}

export async function GET() { return POST() }

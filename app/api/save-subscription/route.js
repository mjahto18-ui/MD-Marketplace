export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const { userId, subscriptionId } = await req.json();

    if (!userId ||!subscriptionId) {
      return NextResponse.json({
        success: false,
        message: "Missing data",
      });
    }

    const supabase = getSupabase();

    // أولاً: إزالة Subscription ID من أي مستخدم آخر
    await supabase.from('users').update({ "Subscription ID": "" }).eq("Subscription ID", subscriptionId).neq("User ID", userId.toString());

    // ثانياً: البحث عن المستخدم الحالي
    const { data: users } = await supabase.from('users').select('*').eq("User ID", userId.toString()).limit(1);
    let user = users?.[0];

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      });
    }

    // ثالثاً: حفظ Subscription ID للمستخدم الحالي
    const { error } = await supabase.from('users').update({
      "Subscription ID": subscriptionId
    }).eq("User ID", userId.toString());

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Subscription updated",
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({
      success: false,
      message: "Server error",
    }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function getGlobalConfig() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log("USING URL:", url);

    const res = await fetch(`${url}/rest/v1/md_global_control?select=*`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
    });

    const rows = await res.json();
    console.log("ROWS FROM DB:", rows);

    let cfg = {};
    (rows||[]).forEach(r => {
      const k = (r['Key'] || '').toString().trim().toUpperCase();
      const vRaw = (r['Value'] || '').toString().trim();
      const v = vRaw.toUpperCase();
      let m = (r['Message_ar'] || '').toString().trim();
      if(m.toUpperCase() === 'TRUE' || m.toUpperCase() === 'FALSE') m = "";
      cfg[k] = { raw: vRaw, value: v, message: m, extra: r['Active_From'] || '' };
    });

    const parseTime = (t) => {
      if(!t) return null;
      const [h, m] = t.split(':').map(Number);
      if(isNaN(h) || isNaN(m)) return null;
      return h * 60 + m;
    };
    const beirutNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
    const nowMinutes = beirutNow.getHours() * 60 + beirutNow.getMinutes();
    const cartOpen = parseTime(cfg['CART_OPEN_TIME']?.raw);
    const cartClose = parseTime(cfg['CART_CLOSE_TIME']?.raw);

    return {
      rawConfig: cfg,
      isCartClosed: cfg['CART_ENABLED']?.value === 'FALSE',
      isComingSoon: cfg['PLATFORM_STATUS']?.value === 'COMING_SOON',
      isLocked: cfg['EMERGENCY_LOCK']?.value === 'TRUE',
      coming_soon_message: cfg['PLATFORM_STATUS']?.message || "",
      coming_soon: cfg['PLATFORM_STATUS'],
      countdown_date: cfg['COUNTDOWN_DATE']?.raw || "",
      banner_enabled: cfg['BANNER_ENABLED']?.value === 'TRUE',
      isBannerEnabled: cfg['BANNER_ENABLED']?.value === 'TRUE',
      cart_open_time: cfg['CART_OPEN_TIME']?.raw || '08:00',
      cart_close_time: cfg['CART_CLOSE_TIME']?.raw || '22:00',
      isCartInHours: cartOpen!== null && cartClose!== null? (nowMinutes >= cartOpen && nowMinutes <= cartClose) : true,
      isWhatsappEnabled: cfg['WHATSAPP_ENABLED']?.value!== 'FALSE',
      isWhatsappCartClosed: cfg['WHATSAPP_CART_ENABLED']?.value === 'FALSE',
      cart_closed_message: cfg['CART_ENABLED']?.message || "",
      cart_enabled: cfg['CART_ENABLED'],
      platform_status: cfg['PLATFORM_STATUS'],
      emergency_lock: cfg['EMERGENCY_LOCK'],
    };
  } catch (e) {
    console.log("GlobalConfig Error:", e.message);
    return { isCartClosed: false, isLocked: false, isComingSoon: false, isWhatsappEnabled: true, isWhatsappCartClosed: false, isCartInHours: true, isBannerEnabled: true };
  }
}

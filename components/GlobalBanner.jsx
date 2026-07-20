'use client'
import { useEffect, useState } from 'react';

export default function GlobalBanner() {
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    fetch('/api/config').then(r=>r.json()).then(setCfg);
  }, []);

  if (!cfg) return null;

  // حالة الحداد - سكر كل شي
  if (cfg.emergency_lock?.value == 'TRUE') {
    return <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-[9999]">{cfg.emergency_lock.message}</div>
  }

  let msg = '';
  let showBanner = false;

  if (cfg.platform_status?.value == 'coming_soon') {
    msg = cfg.platform_status.message.replace('{days}', cfg.daysLeft);
    showBanner = true;
  }

  if (cfg.cart_enabled?.value == 'FALSE') {
    msg = cfg.cart_enabled.message;
    showBanner = true;
  }

  if (!showBanner) return null;

  return (
    <div className="bg-orange-500 text-white text-center p-3 font-bold">
      {msg} {cfg.platform_status?.value == 'coming_soon' && `(${cfg.daysLeft} يوم)`}
    </div>
  )
}

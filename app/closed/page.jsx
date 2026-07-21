'use client';
import { useEffect, useState } from 'react';

export default function ClosedPage(){
  const [lockMsg, setLockMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/global-config', { cache: 'no-store' })
    .then(r => r.json())
    .then(d => {
        // ناخد الرسالة واذا كانت TRUE/FALSE او فاضية نحط رسالة افتراضية
        let msg = d?.emergency_lock?.message?.trim() || d?.emergency_lock_message?.trim() || "";
        if(!msg || msg.toUpperCase() === 'TRUE' || msg.toUpperCase() === 'FALSE'){
          msg = ""; // خليها فاضية ليروح عالحداد الافتراضي تحت
        }
        setLockMsg(msg);
        setLoading(false);
      })
    .catch(() => setLoading(false));
  }, []);

  if(loading) return <div style={{minHeight:'100vh', background:'black'}}></div>;

  // اذا في مسج بسطر EMERGENCY_LOCK - اعرضو هو بسطر واحد
  if(lockMsg){
    return (
      <div style={{minHeight:'100vh', background:'black', color:'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'20px', direction:'rtl'}}>
        <h1 style={{fontSize:'36px', lineHeight:'1.4'}}>{lockMsg}</h1>
        <p style={{marginTop:'30px', fontSize:'14px', opacity:0.5}}>MD-Marketplace</p>
      </div>
    );
  }

  // اذا فاضي - حداد افتراضي
  return (
    <div style={{minHeight:'100vh', background:'black', color:'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'20px', direction:'rtl'}}>
      <h1 style={{fontSize:'40px', marginBottom:'20px'}}>إنا لله وإنا إليه راجعون</h1>
      <p style={{fontSize:'20px', opacity:0.8}}>نعتذر، المنصة متوقفة مؤقتاً حداداً وستعود قريباً</p>
      <p style={{marginTop:'30px', fontSize:'14px', opacity:0.5}}>MD-Marketplace</p>
    </div>
  );
}

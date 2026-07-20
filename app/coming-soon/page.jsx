import { getGlobalConfig } from '@/lib/getGlobalConfig';

export const dynamic = 'force-dynamic';

export default async function ComingSoonPage(){
  const config = await getGlobalConfig();
  
  const msg = config.PLATFORM_STATUS?.message || config.platform_status?.message || config.PLATFORM_STATUS?.value || "نعود قريباً";
  const days = config.daysLeft || 0;

  let display = days > 1 ? `${days} يوم` : days === 1 ? `24 ساعة` : `ساعات قليلة`;

  return (
    <div style={{minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#111', color:'white', textAlign:'center', padding:'20px'}}>
      <h1 style={{fontSize:'50px'}}>قريباً ⏳</h1>
      <p style={{fontSize:'22px', marginTop:'15px', maxWidth:'500px'}}>{msg}</p>
      <div style={{marginTop:'30px', background:'white', color:'black', padding:'15px 40px', borderRadius:'15px', fontSize:'32px', fontWeight:'bold'}}>
        {display}
      </div>
    </div>
  )
}

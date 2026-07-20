import { getGlobalConfig } from '@/lib/getGlobalConfig';

export const dynamic = 'force-dynamic';

export default async function ComingSoonPage(){
  const config = await getGlobalConfig();
  
  const msg = config.PLATFORM_STATUS?.message || config.platform_status?.message || "باقي 25 يوم للافتتاح الكبير 🔥";
  const days = config.daysLeft || 25;

  return (
    <div style={{minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#111', color:'white'}}>
      <h1 style={{fontSize:'50px', fontWeight:'bold'}}>قريباً 🔥</h1>
      <p style={{fontSize:'22px', marginTop:'15px'}}>{msg}</p>
      <div style={{marginTop:'30px', background:'white', color:'black', padding:'15px 30px', borderRadius:'10px', fontSize:'30px', fontWeight:'bold'}}>
        {days} يوم
      </div>
    </div>
  )
}

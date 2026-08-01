'use client';
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import OrderSuccessContent from "./OrderSuccessContent";

export default function Page() {
  return (
    <Suspense fallback={<div style={{color:'white'}}>جاري التحميل...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}

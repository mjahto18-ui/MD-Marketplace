'use client';
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import SpecialOrderSuccessContent from "./SpecialOrderSuccessContent";

export default function Page() {
  return (
    <Suspense fallback={<div style={{color:'white'}}>جاري التحميل...</div>}>
      <SpecialOrderSuccessContent />
    </Suspense>
  );
}

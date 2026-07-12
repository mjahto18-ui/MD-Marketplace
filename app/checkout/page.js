'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  
  const handleConfirm = async () => {
    // هون بتبعت البيانات للـ API اللي عملناه
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerID: "5482cbf7", // من السيشن تبع الزبون
        areaID: "fad82d73", // من Select Area
        deliveryAddress: "ابن سينا وادي حلول", // من Input
        note: "ازا ما لقى لبنة..." // من Textarea
      })
    });
    
    const data = await res.json();
    
    if(data.success) {
      // اذا نجح، روح ع صفحة النجاح
      router.push(`/order-success?id=${data.request_id}`);
    } else {
      alert('صار خطأ');
    }
  };

  return (
    <button onClick={handleConfirm}>تأكيد الطلب</button>
  );
}

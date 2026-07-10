"use client";
import { useEffect } from "react";

export default function OneSignalInit() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.OneSignal = window.OneSignal || [];
      OneSignal.push(function () {
        OneSignal.init({
          appId: "8736bcd3-452e-4b06-a3c1-0363071f1254",
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false,
          },
        });
      });
    }
  }, []);

  return null;
}

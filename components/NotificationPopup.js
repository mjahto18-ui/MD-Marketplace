async function enableNotifications() {
  setShowPopup(false);

  alert("نستخدم الإشعارات لتحسين تجربتك داخل التطبيق، ولإعلامك بحالة طلباتك، التوصيل، والعروض الجديدة.");

  // ⭐ ننتظر OneSignal ليجهز بالكامل
  await OneSignal.User.waitUntilReady();

  // ⭐ هلق منطلب الإذن
  const permission = await OneSignal.Notifications.requestPermission();

  if (permission === "granted") {

    // ⭐ ننتظر الـ Service Worker يعمل registration كامل
    await OneSignal.User.waitUntilReady();

    const subId = await OneSignal.User.getSubscriptionId();

    console.log("SUB ID:", subId);

    await fetch("/api/save-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        subscriptionId: subId
      })
    });
  }
}

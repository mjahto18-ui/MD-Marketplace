async function enableNotifications() {
  setShowPopup(false);

  alert("نستخدم الإشعارات لتحسين تجربتك داخل التطبيق، ولإعلامك بحالة طلباتك، التوصيل، والعروض الجديدة.");

  const permission = await OneSignal.Notifications.requestPermission();

  if (permission === "granted") {
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

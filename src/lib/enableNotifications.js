  // دالة مساعدة: تحويل VAPID public key من Base64 إلى Uint8Array
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  export async function enableNotifications() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('لم يتم منح إذن الإشعارات.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // 🔍 first check if there is an active subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // ✅ Converting the key from String to Uint8Array — required by pushManager
        const applicationServerKey = urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        );

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ الاشتراك');

      alert('✅ تم تفعيل الإشعارات بنجاح.');
    } catch (err) {
      console.error('enableNotifications error:', err);
      alert(`❌ فشل تفعيل الإشعارات: ${err.message}`);
    }
  }

export async function checkSubscription() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  return subscription !== null;
}
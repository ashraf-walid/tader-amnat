// دالة مساعدة: تحويل VAPID public key من Base64 إلى Uint8Array
function urlBase64ToUint8Array(base64String) {
  if (!base64String) {
    throw new Error('VAPID public key is missing or undefined.');
  }
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function enableNotifications() {
  if (typeof window === 'undefined') return;

  // 1. تحقق من دعم متصفح المستخدم للإشعارات الأساسية
  if (!('Notification' in window)) {
    alert('⚠️ الإشعارات غير مدعومة في هذا المتصفح.');
    return;
  }

  // 2. تحقق من دعم Service Worker و PushManager
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('⚠️ نظام إشعارات الدفع (Push) غير مدعوم في هذا المتصفح/البيئة.');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('⚠️ لم يتم منح إذن الإشعارات. يرجى تفعيل الإذن من إعدادات المتصفح.');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration || !registration.pushManager) {
      alert('⚠️ خدمة إرسال الإشعارات (PushManager) غير متوفرة أو غير نشطة.');
      return;
    }

    // 🔍 التحقق أولاً مما إذا كان هناك اشتراك نشط بالفعل
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('مفتاح VAPID العام غير معرف في متغيرات البيئة.');
      }

      // ✅ تحويل المفتاح من String إلى Uint8Array — مطلوب بواسطة pushManager
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

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
    if (!res.ok) throw new Error(data.error || 'فشل حفظ الاشتراك في قاعدة البيانات');

    alert('✅ تم تفعيل الإشعارات بنجاح.');
  } catch (err) {
    console.error('enableNotifications error:', err);
    alert(`❌ فشل تفعيل الإشعارات: ${err.message}`);
  }
}

export async function checkSubscription() {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return false;
  }
  try {
    // نستخدم getRegistration لتجنب التعليق (hanging) إذا لم يكن الـ service worker مسجلاً بعد
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !registration.pushManager) return false;

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (err) {
    console.error('checkSubscription error:', err);
    return false;
  }
}

export async function disableNotifications() {
  if (typeof window === 'undefined') return;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('⚠️ نظام إشعارات الدفع (Push) غير مدعوم في هذا المتصفح/البيئة.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration || !registration.pushManager) {
      alert('⚠️ خدمة إرسال الإشعارات (PushManager) غير متوفرة أو غير نشطة.');
      return;
    }

    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      
      // 1. إلغاء الاشتراك من المتصفح (Push Service)
      const unsubscribed = await subscription.unsubscribe();
      
      if (unsubscribed) {
        // 2. إعلام الخادم لحذف الاشتراك من قاعدة البيانات
        const res = await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.warn('تنبيه: فشل حذف الاشتراك من الخادم ولكن تم إلغاؤه من المتصفح:', data.error);
        }
      }
    }

    alert('❌ تم إلغاء تفعيل الإشعارات بنجاح.');
  } catch (err) {
    console.error('disableNotifications error:', err);
    alert(`❌ فشل إلغاء تفعيل الإشعارات: ${err.message}`);
  }
}
// 🔒 lock to prevent concurrent operations
let isOperationInProgress = false;

// helper function to convert VAPID public key from Base64 to Uint8Array
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

  // 🔒 prevent multiple operations
  if (isOperationInProgress) {
    console.log('operation is already in progress, please wait...');
    return;
  }

  // 1. checking browser support for notifications
  if (!('Notification' in window)) {
    alert('⚠️ notifications are not supported in this browser.');
    return;
  }

  // 2. checking browser support for push notifications
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('⚠️ push notifications are not supported in this browser/environment.');
    return;
  }

  try {
    isOperationInProgress = true; // 🔒 lock the operation

    // checking if the app is installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = isStandalone || window.navigator.standalone; // iOS standalone detection
    
    if (!isInstalled) {
      const proceed = confirm(
        '💡 للحصول على أفضل تجربة، يُفضل تثبيت التطبيق أولاً.\n\nهل تريد المتابعة بتفعيل الإشعارات بدون تثبيت؟'
      );
      if (!proceed) {
        console.log('المستخدم اختار عدم المتابعة بدون تثبيت التطبيق');
        return;
      }
    }

    // requesting permission from the user
    const permission = await Notification.requestPermission();
    
    // if permission is not granted, exit quietly
    if (permission !== 'granted') {
      console.log('Notification permission not granted:', permission);
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration || !registration.pushManager) {
      alert('⚠️ خدمة إرسال الإشعارات (PushManager) غير متوفرة أو غير نشطة.');
      return;
    }

    // checking if there is an active subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key is missing or undefined.');
      }

      // converting the key from String to Uint8Array
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
    if (!res.ok) throw new Error(data.error || 'Failed to save subscription to database');

    alert('✅ Notifications enabled successfully.');
  } catch (err) {
    console.error('enableNotifications error:', err);
    alert(`❌ Failed to enable notifications: ${err.message}`);
  } finally {
    isOperationInProgress = false; // 🔓 unlock the operation
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
    // using getRegistration to avoid hanging if the service worker is not registered yet
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

  // 🔒 prevent multiple operations
  if (isOperationInProgress) {
    console.log('عملية إشعارات قيد التنفيذ بالفعل، يُرجى الانتظار...');
    return;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('⚠️ push notifications are not supported in this browser/environment.');
    return;
  }

  try {
    isOperationInProgress = true; // 🔒 lock the operation

    const registration = await navigator.serviceWorker.ready;
    if (!registration || !registration.pushManager) {
      alert('⚠️ push notifications are not supported in this browser/environment.');
      return;
    }

    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      
      // 1. unsubscribe from push service
      const unsubscribed = await subscription.unsubscribe();
      
      if (unsubscribed) {
        // 2. notify server to delete subscription from database
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
  } finally {
    isOperationInProgress = false; // 🔓 unlock the operation
  }
}
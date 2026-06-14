'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePWAInstall — Hook لإدارة تثبيت التطبيق كـ PWA
 *
 * يُرجع:
 *  - canInstall: boolean — هل يمكن التثبيت الآن؟
 *  - install: function — استدعاء لتشغيل حوار التثبيت
 *  - installed: boolean — هل تم التثبيت للتو؟
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // إذا كان التطبيق يعمل بالفعل في وضع standalone (مثبّت مسبقاً) فلا حاجة لأي شيء
    if (typeof window === 'undefined') return;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setInstalled(true);
      // إخفاء الـ toast بعد ثانيتين
      setTimeout(() => setInstalled(false), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setCanInstall(false);
    }
  }, [deferredPrompt]);

  return { canInstall, install, installed };
}

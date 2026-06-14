'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePWAInstall — Hook لإدارة تثبيت التطبيق كـ PWA
 *
 * يُرجع:
 *  - canInstall: boolean — هل يمكن التثبيت الآن؟
 *  - install: function — استدعاء لتشغيل حوار التثبيت
 *  - installed: boolean — هل تم التثبيت للتو؟
 *  - isInstalled: boolean — هل التطبيق مثبّت حالياً (وضع standalone)؟
 *  - isSupported: boolean — هل المتصفح يدعم تثبيت PWA؟
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    
    setIsInstalled(isStandalone);
    setIsSupported('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window);

    if (isStandalone) return;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsInstalled(true);
      setInstalled(true);
      setTimeout(() => setInstalled(false), 2000);
    };

    const handleDisplayModeChange = (e) => {
      setIsInstalled(e.matches);
    };

    const displayModeMedia = window.matchMedia('(display-mode: standalone)');
    displayModeMedia.addEventListener('change', handleDisplayModeChange);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      displayModeMedia.removeEventListener('change', handleDisplayModeChange);
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
      setIsInstalled(true);
    }
  }, [deferredPrompt]);

  return { canInstall, install, installed, isInstalled, isSupported };
}

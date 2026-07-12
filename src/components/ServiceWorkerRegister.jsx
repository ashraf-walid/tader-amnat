'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ServiceWorkerRegister() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Disable SW during development to prevent caching
    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      return;
    }

    const handleLoad = () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch((err) => {
          console.log('[ServiceWorker registration failed: ', err);
        });
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  // كشف بيئة التشغيل وإرسال إشعار للسيرفر لتسجيل تثبيت PWA
  useEffect(() => {
    if (typeof window === 'undefined' || pathname === '/login') return;

    const isRunningAsPWA = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;

    if (isRunningAsPWA) {
      const isReported = localStorage.getItem('pwa_reported');
      if (!isReported) {
        fetch('/api/auth/pwa-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPwa: true })
        }).then((res) => {
          if (res.ok) {
            localStorage.setItem('pwa_reported', 'true');
          }
        }).catch((err) => {
          console.error('[PWA status check failed]', err);
        });
      }
    }
  }, [pathname]);

  return null;
}

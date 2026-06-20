'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // تعطيل SW أثناء التطوير لمنع الكاش
    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch((err) => {
          console.log('[ServiceWorker registration failed: ', err);
        });
    });
  }, []);

  return null;
}

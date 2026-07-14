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

          // Listen for new SW being found
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[ServiceWorker] Update found, new worker installing');

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                console.log('[ServiceWorker] New worker installed');
              }
            });
          });
        })
        .catch((err) => {
          console.log('[ServiceWorker registration failed: ', err);
        });
    };

    // Listen for controller change to reload page silently
    const handleControllerChange = () => {
      console.log('[ServiceWorker] Controller changed, reloading page');
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => {
        window.removeEventListener('load', handleLoad);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // Detected the operating environment and sent a notification to the server to register the PWA installation.
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

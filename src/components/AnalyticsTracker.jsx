'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const THROTTLE_MS = 30 * 60 * 1000;
const UNTRACKED_PAGES = ['/login'];

/**
 * Records that the signed-in user opened a page, at most once every
 * 30 minutes per page. The server ignores owner and admin visits.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' || !pathname) return;
    if (UNTRACKED_PAGES.includes(pathname)) return;

    const storageKey = `page_visit:${pathname}`;
    try {
      const lastSent = Number(localStorage.getItem(storageKey));
      if (lastSent && Date.now() - lastSent < THROTTLE_MS) return;
      localStorage.setItem(storageKey, String(Date.now()));
    } catch {
      // Storage can be blocked; recording one extra visit is harmless
    }

    fetch('/api/page-visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}

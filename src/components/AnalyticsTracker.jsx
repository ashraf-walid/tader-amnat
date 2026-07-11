'use client';

import { usePathname } from 'next/navigation';
import { usePageAnalytics } from '@/hooks/usePageAnalytics';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  usePageAnalytics(pathname);

  return null;
}

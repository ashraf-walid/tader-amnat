'use client';

import { usePathname } from 'next/navigation';
import AdminNav from './AdminNav';

export default function ClientNavWrapper() {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  return <AdminNav />;
}

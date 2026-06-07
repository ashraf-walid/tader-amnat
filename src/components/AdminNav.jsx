'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'تحليل الحسابات', icon: '📊' },
  { href: '/admin', label: 'لوحة الإدارة', icon: '⚙️' },
  { href: '/Storagecalculator', label: 'حاسبة التخزين', icon: '⚓' },
  { href: '/Storagecalculator/rates', label: 'التعريفات', icon: '📋' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && (data.user.role === 'admin' || data.user.role === 'owner')) {
          setIsAdmin(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || !isAdmin) return null;

  return (
    <nav
      dir="rtl"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '8px 16px',
        fontFamily: "'Tajawal', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginLeft: 8,
            whiteSpace: 'nowrap',
          }}
        >
          تنقل سريع
        </span>

        {NAV_ITEMS.map(item => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#0b1120' : '#cbd5e1',
                background: isActive
                  ? 'linear-gradient(135deg, #60a5fa, #3b82f6)'
                  : 'rgba(255,255,255,0.06)',
                border: isActive
                  ? '1px solid rgba(96,165,250,0.5)'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                textDecoration: 'none',
                transition: 'all 0.2s',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#f0f2f8';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = '#cbd5e1';
                }
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

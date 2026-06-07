'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'تحليل الحسابات',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    exactMatch: true,
  },
  {
    href: '/admin',
    label: 'لوحة الإدارة',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
      </svg>
    ),
    exactMatch: true,
  },
  {
    href: '/Storagecalculator',
    label: 'حاسبة التخزين',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8m-4-4v4"/>
      </svg>
    ),
    exactMatch: true,
  },
  {
    href: '/Storagecalculator/rates',
    label: 'التعريفات',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    exactMatch: true,
  },
];

export default function AdminNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [user, setUser]         = useState(null);
  const [loaded, setLoaded]     = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logging, setLogging]   = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.success && (d.user.role === 'admin' || d.user.role === 'owner')) {
          setUser(d.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // إغلاق القائمة عند تغيير المسار
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleLogout = async () => {
    setLogging(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      setLogging(false);
    }
  };

  if (!loaded || !user) return null;

  const isActive = (item) =>
    item.exactMatch ? pathname === item.href : pathname.startsWith(item.href);

  const roleLabels = { owner: 'المالك', admin: 'مدير', employee: 'موظف', client: 'عميل' };
  const roleColors = { owner: '#f0b429', admin: '#818cf8', employee: '#34d399', client: '#60a5fa' };
  const roleColor  = roleColors[user?.role] || '#60a5fa';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700&display=swap');
        .adminnav-link { transition: background 0.15s, color 0.15s, border-color 0.15s; }
        .adminnav-link:hover:not(.adminnav-active) {
          background: rgba(255,255,255,0.1) !important;
          color: #f0f2f8 !important;
        }
        .adminnav-userbtn:hover { background: rgba(255,255,255,0.08) !important; }
        .adminnav-logout:hover  { background: rgba(248,113,113,0.15) !important; color: #f87171 !important; }
        .adminnav-mobile-item:hover { background: rgba(255,255,255,0.07) !important; }
        @keyframes adminnav-fadein {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .adminnav-desktop { display: none !important; }
          .adminnav-hamburger { display: flex !important; }
        }
        @media (min-width: 641px) {
          .adminnav-desktop { display: flex !important; }
          .adminnav-hamburger { display: none !important; }
        }
      `}</style>

      <nav
        dir="rtl"
        role="navigation"
        aria-label="قائمة تنقل المدير"
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(13, 20, 36, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          fontFamily: "'Tajawal', system-ui, sans-serif",
          marginBottom: '20px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* ── شريط الدور (خط رفيع ملوّن أعلى الشريط) ── */}
        <div style={{
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${roleColor} 40%, ${roleColor} 60%, transparent 100%)`,
          opacity: 0.7,
        }} />

        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '0 16px', height: 52,
          display: 'flex', alignItems: 'center',
          gap: 6,
        }}>

          {/* ── شعار النظام ── */}
          {/* <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12, flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #1d4ed8, #60a5fa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f2f8', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>
              أرضيات الحاويات
            </span>
          </div> */}

          {/* ── فاصل ── */}
          {/* <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', marginLeft: 4 }} /> */}

          {/* ── روابط التنقل (desktop) ── */}
          <div className="adminnav-desktop" style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden',
          }}>
            {NAV_ITEMS.map(item => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`adminnav-link${active ? ' adminnav-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', fontSize: 13, fontWeight: active ? 500 : 400,
                    color: active ? '#fff' : '#94a3b8',
                    background: active ? 'rgba(96,165,250,0.18)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(96,165,250,0.35)' : 'transparent'}`,
                    borderRadius: 8, textDecoration: 'none',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.7, display: 'flex' }}>{item.icon}</span>
                  {item.label}
                  {/* مؤشر نقطة الصفحة الحالية */}
                  {active && (
                    <span style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: '#60a5fa', flexShrink: 0,
                    }} />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── مساحة مرنة ── */}
          <div style={{ flex: 1 }} />

          {/* ── معلومات المستخدم + قائمة منسدلة ── */}
          <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              className="adminnav-userbtn"
              onClick={() => setMenuOpen(v => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="قائمة المستخدم"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 10px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {/* أفاتار */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: `${roleColor}22`,
                border: `1.5px solid ${roleColor}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: roleColor,
                flexShrink: 0,
              }}>
                {user?.username?.[0]?.toUpperCase() || '؟'}
              </div>

              {/* الاسم والدور */}
              <div style={{ textAlign: 'right', lineHeight: 1.2, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#f0f2f8', whiteSpace: 'nowrap' }}>
                  {user?.username}
                </span>
                <span style={{ fontSize: 10.5, color: roleColor, fontWeight: 500 }}>
                  {roleLabels[user?.role] || user?.role}
                </span>
              </div>

              {/* سهم */}
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* القائمة المنسدلة */}

            {menuOpen && (
              <div className="hidden md:block" style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                minWidth: 200, background: '#1a2035',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
                animation: 'adminnav-fadein 0.18s ease',
                zIndex: 100,
              }}>
                {/* رأس القائمة */}
                <div style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f0f2f8' }}>{user?.username}</p>
                  {user?.officeName && (
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#60a5fa', fontWeight: 500 }}>{user.officeName}</p>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#64748b' }}>{user?.phone || 'لا يوجد هاتف'}</p>
                </div>

                {/* روابط إضافية */}
                <div style={{ padding: '6px 0' }}>
                  <Link
                    href="/admin"
                    className="adminnav-mobile-item"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', fontSize: 13, color: '#cbd5e1',
                      textDecoration: 'none', transition: 'background 0.12s',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                    </svg>
                    لوحة الإدارة
                  </Link>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                  <button
                    className="adminnav-logout"
                    onClick={handleLogout}
                    disabled={logging}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', fontSize: 13, color: '#f87171',
                      background: 'none', border: 'none', cursor: 'pointer',
                      textAlign: 'right', fontFamily: "'Tajawal', system-ui, sans-serif",
                      transition: 'background 0.12s',
                    }}
                  >
                    {logging ? (
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%',
                        border: '2px solid rgba(248,113,113,0.3)', borderTopColor: '#f87171',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                    )}
                    {logging ? 'جاري الخروج...' : 'تسجيل الخروج'}
                  </button>
                </div>
              </div>
            )}




          </div>

          {/* ── زر الهامبرغر (mobile) ── */}
          <button
            className="adminnav-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-label="فتح القائمة"
            style={{
              display: 'none', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              cursor: 'pointer', flexShrink: 0, marginRight: 4,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>

        </div>

        {/* ── قائمة الجوال المنسدلة ── */}
        {menuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(13, 20, 36, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            padding: '8px 12px 12px',
            display: 'flex', flexDirection: 'column', gap: 4,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            animation: 'adminnav-fadein 0.2s ease-out',
          }}
          className="adminnav-hamburger"
          >
            {NAV_ITEMS.map(item => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="adminnav-mobile-item"
                  aria-current={active ? 'page' : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', fontSize: 14, borderRadius: 8,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#60a5fa' : '#94a3b8',
                    background: active ? 'rgba(96,165,250,0.1)' : 'transparent',
                    textDecoration: 'none', transition: 'background 0.12s',
                  }}
                >
                  <span style={{ display: 'flex' }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', fontSize: 14, borderRadius: 8,
                color: '#f87171', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: "'Tajawal', system-ui, sans-serif",
                textAlign: 'right',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              تسجيل الخروج
            </button>
          </div>
        )}
      </nav>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
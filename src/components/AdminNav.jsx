'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  NavChartIcon,
  NavSettingsIcon,
  NavMonitorIcon,
  NavFileTextIcon,
  ChevronDownIcon,
  LogOutIcon,
  MenuIcon,
  CloseIcon,
} from '@/components/Icons';

const NAV_ITEMS = [
  { href: '/',                      label: 'تحليل الحسابات', icon: NavChartIcon,    exactMatch: true },
  { href: '/admin',                  label: 'لوحة الإدارة',   icon: NavSettingsIcon, exactMatch: true },
  { href: '/Storagecalculator',      label: 'حاسبة التخزين',  icon: NavMonitorIcon,  exactMatch: true },
  { href: '/Storagecalculator/rates',label: 'التعريفات',       icon: NavFileTextIcon, exactMatch: true },
];

const roleLabels = { owner: 'المالك', admin: 'مدير', employee: 'موظف', client: 'عميل' };
const roleColors = { owner: '#f0b429', admin: '#818cf8', employee: '#34d399',  client: '#60a5fa' };

// ذاكرة تخزين مؤقت لتجنب تأخير التحميل عند الانتقال بين الصفحات (SPA Navigation)
let cachedUser = null;
let cachedLoaded = false;

export default function AdminNav() {
  const pathname  = usePathname();
  const router    = useRouter();

  const [user, setUser]           = useState(cachedUser);
  const [loaded, setLoaded]       = useState(cachedLoaded);
  const [logging, setLogging]     = useState(false);

  // ── حالتان منفصلتان: dropdown المستخدم على الديسكتوب، وقائمة الجوال ──
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);

  const userMenuRef = useRef(null);
  const prevPathnameRef = useRef(pathname);

  // إغلاق القائمتين عند تغيير المسار
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setUserMenuOpen(false);
      setMobileOpen(false);
    }
  }, [pathname]);

  // جلب بيانات المستخدم مع دعم التحديث التلقائي في الخلفية (Stale-While-Revalidate)
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.success && (d.user.role === 'admin' || d.user.role === 'owner')) {
          setUser(d.user);
          cachedUser = d.user;
          cachedLoaded = true;
        } else {
          setUser(null);
          cachedUser = null;
          cachedLoaded = true;
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoaded(true);
      });
  }, []);

  // إغلاق dropdown المستخدم عند النقر خارجه
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  // منع تمرير الصفحة عند فتح قائمة الجوال
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    setLogging(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      cachedUser = null;
      cachedLoaded = false;
      setUser(null);
      setLoaded(false);
      router.push('/login');
    } catch {
      setLogging(false);
    }
  };

  // ── منع وميض الصفحة (CLS): نعرض شريطاً فارغاً بنفس الارتفاع أثناء التحميل لأول مرة فقط ──
  if (!loaded) {
    return (
      <div
        aria-hidden="true"
        style={{
          height: 56,
          background: 'rgba(13,20,36,0.93)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      />
    );
  }

  // إذا انتهى التحميل ولم يكن المستخدم مسجل دخول أو ليس لديه صلاحيات، لا يتم عرض النافبار
  if (!user) {
    return null;
  }

  const isActive = (item) =>
    item.exactMatch ? pathname === item.href : pathname.startsWith(item.href);

  const roleColor = roleColors[user?.role] || '#60a5fa';

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          شريط التنقل الرئيسي
      ══════════════════════════════════════════════════════ */}
      <nav
        dir="rtl"
        role="navigation"
        aria-label="قائمة تنقل المدير"
        className="sticky top-0 z-50 font-sans"
        style={{
          background: 'rgba(13,20,36,0.93)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        }}
      >
        {/* شريط الدور الملوّن */}
        <div
          style={{
            height: 2,
            opacity: 0.75,
            background: `linear-gradient(90deg, transparent 0%, ${roleColor} 40%, ${roleColor} 60%, transparent 100%)`,
          }}
        />

        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 16px',
            height: 54,
            display: 'flex ',
            alignItems: 'center',
            gap: 6,
          }}
        >

                    {/* ── زر الهامبرغر (جوال فقط) ── */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            className="admin-hamburger"
          >
            {mobileOpen ? <CloseIcon size={17} /> : <MenuIcon size={17} />}
          </button>
          
          {/* ── روابط التنقل (ديسكتوب) ── */}
          <div className="admin-nav-links">
            {NAV_ITEMS.map(item => {
              const active   = isActive(item);
              const IconComp = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    fontSize: 13,
                    borderRadius: 8,
                    border: `1px solid ${active ? 'rgba(59,130,246,0.35)' : 'transparent'}`,
                    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: active ? '#fff' : '#94a3b8',
                    fontWeight: active ? 600 : 400,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  className="admin-nav-link"
                >
                  <span style={{ display: 'flex', opacity: active ? 1 : 0.7 }}>
                    <IconComp />
                  </span>
                  {item.label}
                  {active && (
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: '#3b82f6',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* مساحة مرنة */}
          <div style={{ flex: 1 }} />

          {/* ── زر معلومات المستخدم + dropdown (ديسكتوب) ── */}
          <div ref={userMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label="قائمة المستخدم"
              className="admin-nav-user-btn"
            >
              {/* أفاتار */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: `${roleColor}22`,
                  border: `1.5px solid ${roleColor}55`,
                  color: roleColor,
                }}
              >
                {user?.username?.[0]?.toUpperCase() || '؟'}
              </div>

              {/* الاسم والدور */}
              <div style={{ textAlign: 'right', lineHeight: 1.3, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                  {user?.username}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 500, color: roleColor }}>
                  {roleLabels[user?.role] || user?.role}
                </span>
              </div>

              {/* سهم */}
              <ChevronDownIcon
                size={12}
                style={{
                  flexShrink: 0,
                  color: '#64748b',
                  transition: 'transform 0.2s',
                  transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {/* ── Dropdown المستخدم ── */}
            {userMenuOpen && (
              <div className="admin-user-dropdown">
                {/* رأس القائمة */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
                    {user?.username}
                  </p>
                  {user?.officeName && (
                    <p style={{ marginTop: 2, marginBottom: 0, fontSize: 11, color: '#3b82f6', fontWeight: 500 }}>
                      {user.officeName}
                    </p>
                  )}
                  <p style={{ marginTop: 4, marginBottom: 0, fontSize: 11.5, color: '#64748b' }}>
                    {user?.phone || 'لا يوجد هاتف'}
                  </p>
                </div>

                {/* روابط */}
                <div style={{ padding: '6px 0' }}>
                  <Link
                    href="/admin"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 14px',
                      fontSize: 13,
                      color: '#cbd5e1',
                      textDecoration: 'none',
                      transition: 'background 0.12s',
                    }}
                    className="admin-dropdown-item"
                  >
                    <NavSettingsIcon size={14} />
                    لوحة الإدارة
                  </Link>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                  <button
                    onClick={handleLogout}
                    disabled={logging}
                    className="admin-dropdown-item admin-dropdown-logout"
                  >
                    {logging ? (
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          border: '2px solid rgba(248,113,113,0.3)',
                          borderTopColor: '#f87171',
                          animation: 'spin 0.7s linear infinite',
                        }}
                      />
                    ) : (
                      <LogOutIcon size={14} />
                    )}
                    {logging ? 'جاري الخروج...' : 'تسجيل الخروج'}
                  </button>
                </div>
              </div>
            )}
          </div>


        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          قائمة الجوال — Overlay كامل الشاشة
      ══════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <>
          {/* خلفية شفافة لإغلاق القائمة */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 49,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
            aria-hidden="true"
          />

          {/* لوحة القائمة */}
          <div
            dir="rtl"
            className="admin-mobile-panel"
          >
            {/* رأس اللوحة */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    background: `${roleColor}22`,
                    border: `1.5px solid ${roleColor}55`,
                    color: roleColor,
                  }}
                >
                  {user?.username?.[0]?.toUpperCase() || '؟'}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#f1f5f9' }}>
                    {user?.username}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: roleColor }}>
                    {roleLabels[user?.role] || user?.role}
                    {user?.officeName ? ` · ${user.officeName}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* روابط التنقل */}
            <div style={{ padding: '8px 10px', flex: 1 }}>
              <p
                style={{
                  margin: '4px 8px 6px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                التنقل
              </p>
              {NAV_ITEMS.map(item => {
                const active   = isActive(item);
                const IconComp = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 10,
                      marginBottom: 2,
                      textDecoration: 'none',
                      fontWeight: active ? 600 : 400,
                      fontSize: 14,
                      color: active ? '#60a5fa' : '#94a3b8',
                      background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                      border: `1px solid ${active ? 'rgba(59,130,246,0.2)' : 'transparent'}`,
                      transition: 'all 0.12s',
                    }}
                    className="admin-mobile-link"
                  >
                    <span style={{ display: 'flex', opacity: active ? 1 : 0.65 }}>
                      <IconComp size={16} />
                    </span>
                    {item.label}
                    {active && (
                      <span
                        style={{
                          marginRight: 'auto',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#3b82f6',
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* فاصل وتسجيل الخروج */}
            <div
              style={{
                padding: '8px 10px 12px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <button
                onClick={handleLogout}
                disabled={logging}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.18)',
                  color: '#f87171',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: logging ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.12s',
                  opacity: logging ? 0.7 : 1,
                }}
              >
                {logging ? (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: '2px solid rgba(248,113,113,0.3)',
                      borderTopColor: '#f87171',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                ) : (
                  <LogOutIcon size={16} />
                )}
                {logging ? 'جاري الخروج...' : 'تسجيل الخروج'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          CSS المخصص للنافبار
      ══════════════════════════════════════════════════════ */}
      <style>{`
        /* ─ Keyframes ─ */
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes navDropdown {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes mobileSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* ─ روابط الديسكتوب ─ */
        .admin-nav-links {
          display: none;
          align-items: center;
          gap: 2px;
          flex: 1;
          overflow: hidden;
        }
        .admin-nav-link:hover {
          background: rgba(255,255,255,0.08) !important;
          color: #e2e8f0 !important;
        }

        /* ─ زر المستخدم ─ */
        .admin-nav-user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, border-color 0.15s;
        }
        .admin-nav-user-btn:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.18);
        }

        /* ─ Dropdown ديسكتوب ─ */
        .admin-user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          min-width: 210px;
          background: #1a2035;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.3);
          z-index: 100;
          animation: navDropdown 0.18s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .admin-dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          font-size: 13px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: inherit;
          text-align: right;
          transition: background 0.12s;
        }
        .admin-dropdown-item:hover { background: rgba(255,255,255,0.06); }
        .admin-dropdown-logout { color: #f87171; }
        .admin-dropdown-logout:hover { background: rgba(239,68,68,0.12) !important; }

        /* ─ زر الهامبرغر (جوال) ─ */
        .admin-hamburger {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9px;
          cursor: pointer;
          color: #94a3b8;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .admin-hamburger:hover { background: rgba(255,255,255,0.12); }

        /* ─ لوحة الجوال ─ */
        .admin-mobile-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(300px, 85vw);
          z-index: 50;
          background: rgba(13,20,36,0.98);
          border-left: 1px solid rgba(255,255,255,0.09);
          box-shadow: -16px 0 48px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          animation: mobileSlideIn 0.22s cubic-bezier(0.22, 1, 0.36, 1);
          color: #f1f5f9;
          font-family: inherit;
        }
        .admin-mobile-link:hover {
          background: rgba(255,255,255,0.06) !important;
          color: #e2e8f0 !important;
        }

        /* ─ Breakpoints ─ */
        @media (min-width: 768px) {
          .admin-nav-links  { display: flex; }
          .admin-hamburger  { display: none; }
        }
        @media (max-width: 767px) {
          .admin-nav-user-btn span:last-of-type,
          .admin-nav-user-btn div { display: none; }
        }
      `}</style>
    </>
  );
}

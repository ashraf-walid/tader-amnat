'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  NavChartIcon,
  NavSettingsIcon,
  NavMonitorIcon,
  NavFileTextIcon,
  NavBankIcon,
  ChevronDownIcon,
  LogOutIcon,
  MenuIcon,
  CloseIcon,
  InstallIcon,
} from '@/components/Icons';
import { usePWAInstall } from '@/lib/usePWAInstall';
import { clearAnalyticsUserCache } from '@/hooks/usePageAnalytics';
import { enableNotifications, checkSubscription, disableNotifications } from '@/lib/enableNotifications';
import { useUser } from '@/hooks/useUser';
import { useQueryClient } from '@tanstack/react-query';

// ── Toast نجاح التثبيت ──────────────────────────────────────
function InstallSuccessToast({ visible }) {
  const [phase, setPhase] = useState('enter');

  useEffect(() => {
    if (!visible) return;
    setPhase('enter');
    const t = setTimeout(() => setPhase('exit'), 1650);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 left-1/2 z-[9999] -translate-x-1/2 ${phase === 'enter' ? 'pwa-toast-enter' : 'pwa-toast-exit'
        }`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '11px 20px',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.97)',
          border: '1px solid rgba(139, 92, 246, 0.45)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(139,92,246,0.15)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          direction: 'rtl',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          className="pwa-check-pop"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1.5px solid rgba(139, 92, 246, 0.55)',
            color: '#a78bfa',
            flexShrink: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
          ✅ تم تثبيت التطبيق بنجاح!
        </span>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { href: '/admin', label: 'لوحة الإدارة', icon: NavSettingsIcon, exactMatch: true, roles: ['owner', 'admin'] },
  { href: '/', label: 'الحسابات', icon: NavChartIcon, exactMatch: true, roles: ['owner', 'admin', 'employee'] },
  { href: '/Storagecalculator', label: 'أرضيات', icon: NavMonitorIcon, exactMatch: true, roles: ['owner', 'admin', 'employee', 'client'] },
  { href: '/client/balance', label: 'رصيد الحساب', icon: NavChartIcon, exactMatch: true, roles: ['owner', 'client'] },
  { href: '/employees', label: 'الموظفين المتاحين', icon: NavFileTextIcon, exactMatch: true, roles: ['owner', 'admin', 'employee', 'client'] },
  { href: '/bank-accounts', label: 'الحسابات البنكية', icon: NavBankIcon, exactMatch: true, roles: ['owner', 'admin', 'employee', 'client'] },
  { href: '/Storagecalculator/rates', label: 'التعريفه', icon: NavFileTextIcon, exactMatch: true, roles: ['owner', 'admin', 'employee'] },
];

const roleLabels = { owner: '𝔸', admin: 'مدير', employee: 'قائد', client: 'مُستخلص' };
const roleColors = { owner: '#f0b429', admin: '#818cf8', employee: '#34d399', client: '#60a5fa' };



export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const queryClient = useQueryClient();
  const { data: user, isLoading, refetch } = useUser();
  const loaded = !isLoading;
  const [logging, setLogging] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const { canInstall, install, installed, isInstalled, isIOS } = usePWAInstall();

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

  useEffect(() => {
    checkSubscription().then(setIsSubscribed);
  }, []);

  const handleToggleNotifications = async () => {
    if (notificationLoading) return;

    if (!isSubscribed && !isInstalled) {
      alert('⚠️ يرجى تثبيت التطبيق أولاً على جهازك لتتمكن من تفعيل واستقبال الإشعارات.');
      return;
    }

    setNotificationLoading(true);
    try {
      if (isSubscribed) {
        await disableNotifications();
      } else {
        await enableNotifications();
      }
      const status = await checkSubscription();
      setIsSubscribed(status);
    } catch (e) {
      console.error(e);
    } finally {
      setNotificationLoading(false);
    }
  };



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
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    setLogging(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });

      // Clear ALL caches to prevent data leakage between users on shared devices
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
        console.log('[Security] All caches cleared on logout');
      }

      // Optional: Unregister service worker to force fresh installation
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.unregister) {
          await registration.unregister();
          console.log('[Security] Service worker unregistered');
        }
      }

      // Clear analytics user cache so the next visitor is tracked correctly
      clearAnalyticsUserCache();
      localStorage.removeItem('pwa_reported');
      
      // Clear the user cache
      queryClient.invalidateQueries({ queryKey: ['user'] });

      router.push('/login');
    } catch {
      setLogging(false);
    }
  };

  // ── Prevent page flickering (CLS): A blank bar of the same height during the first load ──
  if (!loaded) {
    return (
      <div
        aria-hidden="true"
        className="sticky top-0 z-50 h-14"
        style={{
          background: 'rgba(2,6,23,0.93)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        }}
      />
    );
  }

  if (!user) return null;

  const isActive = (item) =>
    item.exactMatch ? pathname === item.href : pathname.startsWith(item.href);

  const roleColor = roleColors[user?.role] || '#60a5fa';

  return (
    <>
      <InstallSuccessToast visible={installed} />
      <nav
        dir="rtl"
        role="navigation"
        aria-label="قائمة تنقل المدير"
        className="sticky top-0 z-50 font-sans"
        style={{
          background: 'rgba(2,6,23,0.93)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        }}
      >
        {/* Colored role bar */}
        <div
          className="h-0.5 opacity-75"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${roleColor} 40%, ${roleColor} 60%, transparent 100%)` }}
        />

        <div className="max-w-[1200px] mx-auto px-4 h-[54px] flex items-center gap-1.5">
          {/* ── زر الهامبرغر (جوال فقط) ── */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            className="flex md:hidden items-center justify-center w-9 h-9 bg-white/[0.06] border border-white/10 rounded-[9px] text-slate-400 shrink-0 transition-colors hover:bg-white/[0.12]"
          >
            {mobileOpen ? <CloseIcon size={17} /> : <MenuIcon size={17} />}
          </button>

          {/* ── روابط التنقل (ديسكتوب) ── */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            {NAV_ITEMS.filter(item => item.roles.includes(user.role)).map(item => {
              const active = isActive(item);
              const IconComp = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className="admin-nav-link inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-lg shrink-0 transition-all whitespace-nowrap no-underline"
                  style={{
                    border: `1px solid ${active ? 'rgba(59,130,246,0.35)' : 'transparent'}`,
                    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: active ? '#fff' : '#94a3b8',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <span className="flex" style={{ opacity: active ? 1 : 0.7 }}>
                    <IconComp />
                  </span>
                  {item.label}
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* فاصل مرن — يدفع زر المستخدم لليمين على الجوال فقط */}
          <div className="flex-1 md:hidden" />

          {/* ── زر معلومات المستخدم + dropdown ── */}
          <div ref={userMenuRef} className="relative shrink-0">
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label="قائمة المستخدم"
              className="admin-nav-user-btn flex items-center gap-2 px-2.5 py-1.5 bg-transparent border border-white/10 rounded-[10px] cursor-pointer font-[inherit] transition-all hover:bg-white/[0.07] hover:border-white/[0.18]"
            >
              {/* أفاتار */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{
                  background: `${roleColor}22`,
                  border: `1.5px solid ${roleColor}55`,
                  color: roleColor,
                }}
              >
                {user?.username?.[0]?.toUpperCase() || '؟'}
              </div>

              {/* الاسم والدور */}
              <div className="text-right leading-tight flex flex-col">
                <span className="text-[12.5px] font-semibold text-slate-100 whitespace-nowrap">
                  {user?.username.toUpperCase()}
                </span>
                <span className="text-[10.5px] font-medium" style={{ color: roleColor }}>
                  {roleLabels[user?.role] || user?.role}
                </span>
              </div>

              {/* سهم */}
              <ChevronDownIcon
                size={12}
                className="shrink-0 text-slate-500 transition-transform"
                style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {/* ── Dropdown المستخدم ── */}
            {userMenuOpen && (
              <div className="admin-user-dropdown absolute top-[calc(100%+8px)] left-0 min-w-[210px] bg-slate-900 border border-white/10 rounded-[14px] overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.45),0_4px_12px_rgba(0,0,0,0.3)] z-[100] animate-nav-dropdown">
                {/* رأس القائمة */}
                <div className="px-3.5 py-3 border-b border-white/[0.07] bg-white/[0.03]">
                  <p className="m-0 text-[13px] font-semibold text-slate-100">
                    {user?.username.toUpperCase()}
                  </p>
                  {user?.officeName && (
                    <p className="mt-0.5 mb-0 text-[11px] text-blue-500 font-medium">
                      {user.officeName}
                    </p>
                  )}
                  <p className="mt-1 mb-0 text-[11.5px] text-slate-500">
                    {user?.phone || 'لا يوجد هاتف'}
                  </p>
                </div>

                {/* روابط */}
                <div className="py-1.5">
                  {(user.role === 'admin' || user.role === 'owner') && (
                    <>
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="admin-dropdown-item flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-slate-300 no-underline w-full"
                      >
                        <NavSettingsIcon size={14} />
                        لوحة الإدارة
                      </Link>
                      <div className="h-px bg-white/6 my-1" />
                    </>
                  )}

                  {/* ── زر تثبيت PWA (ديسكتوب dropdown) ── */}
                  <>
                    <button
                      onClick={handleToggleNotifications}
                      disabled={notificationLoading}
                      className="admin-dropdown-item flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-slate-300 no-underline cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {notificationLoading ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300/30 border-t-slate-300 animate-spin" />
                      ) : (
                        <div>🔔</div>
                      )}
                      {notificationLoading
                        ? 'جاري التعديل...'
                        : isSubscribed
                        ? 'إلغاء تفعيل الإشعارات'
                        : 'تفعيل الإشعارات'}
                    </button>
                    <div className="h-px bg-white/6 my-1" />
                  </>

                  <>
                    <button
                      id="pwa-install-btn-desktop"
                      onClick={async () => {
                        if (isIOS) {
                          setShowIOSModal(true);
                        } else {
                          await install();
                        }
                        setUserMenuOpen(false);
                      }}
                      disabled={isInstalled || !canInstall}
                      className="pwa-install-btn admin-dropdown-item flex items-center gap-2.5 px-3.5 py-2 text-[13px] w-full bg-transparent border border-transparent rounded-[8px] cursor-pointer font-[inherit] text-right transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ color: '#a78bfa' }}
                    >
                      <InstallIcon size={14} />
                      {isInstalled ? 'مثبت' : 'تثبيت التطبيق'}
                    </button>
                    <div className="h-px bg-white/6 my-1" />
                  </>

                  <button
                    onClick={handleLogout}
                    disabled={logging}
                    className="admin-dropdown-item admin-dropdown-logout flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-400 w-full bg-transparent border-none cursor-pointer font-[inherit] text-right disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {logging ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />
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

      {/* ══════════════════════════════════════════
          قائمة الجوال — Overlay كامل الشاشة
      ══════════════════════════════════════════ */}
      {mobileOpen && (
        <>
          {/* خلفية شفافة لإغلاق القائمة */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[49] bg-black/45 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* لوحة القائمة */}
          <div
            dir="rtl"
            className="admin-mobile-panel fixed top-0 right-0 bottom-0 w-[min(300px,85vw)] z-50 bg-[rgba(2,6,23,0.98)] border-l border-white/[0.09] shadow-[-16px_0_48px_rgba(0,0,0,0.5)] flex flex-col overflow-y-auto animate-mobile-slide-in text-slate-100 font-[inherit]"
          >
            {/* رأس اللوحة */}
            <div className="px-4 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold"
                  style={{
                    background: `${roleColor}22`,
                    border: `1.5px solid ${roleColor}55`,
                    color: roleColor,
                  }}
                >
                  {user?.username?.[0]?.toUpperCase() || '؟'}
                </div>
                <div>
                  <p className="m-0 text-[13.5px] font-semibold text-slate-100">
                    {user?.username.toUpperCase()}
                  </p>
                  <p className="m-0 text-[11px] font-medium" style={{ color: roleColor }}>
                    {roleLabels[user?.role] || user?.role}
                    {user?.officeName ? ` · ${user.officeName}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="bg-white/[0.08] border border-white/[0.12] rounded-lg w-[34px] h-[34px] flex items-center justify-center cursor-pointer text-slate-400"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* روابط التنقل */}
            <div className="p-2.5 flex-1">
              <p className="mx-2 mb-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-[0.08em]">
                التنقل
              </p>
              {NAV_ITEMS.filter(item => item.roles.includes(user.role)).map(item => {
                const active = isActive(item);
                const IconComp = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMobileOpen(false)}
                    className="admin-mobile-link flex items-center gap-3 p-2.5 rounded-[10px] mb-0.5 no-underline transition-all"
                    style={{
                      fontWeight: active ? 600 : 400,
                      fontSize: 14,
                      color: active ? '#60a5fa' : '#94a3b8',
                      background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                      border: `1px solid ${active ? 'rgba(59,130,246,0.2)' : 'transparent'}`,
                    }}
                  >
                    <span className="flex" style={{ opacity: active ? 1 : 0.65 }}>
                      <IconComp size={16} />
                    </span>
                    {item.label}
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* فاصل وتسجيل الخروج */}
            <div className="p-2.5 pb-3 border-t border-white/[0.07] flex flex-col gap-2">

              <button
                onClick={handleToggleNotifications}
                disabled={notificationLoading}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-[10px] text-[13px] bg-blue-500/8 border border-blue-500/18 text-slate-300 text-sm font-semibold transition-all font-[inherit] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {notificationLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300/30 border-t-slate-300 animate-spin" />
                ) : (
                  <div>🔔</div>
                )}
                {notificationLoading
                  ? 'جاري التعديل...'
                  : isSubscribed
                  ? 'إلغاء تفعيل الإشعارات'
                  : 'تفعيل الإشعارات'}
              </button>

              {/* ── زر تثبيت PWA (موبايل panel) ── */}
              <button
                id="pwa-install-btn-mobile"
                onClick={async () => {
                  if (isIOS) {
                    setShowIOSModal(true);
                  } else {
                    await install();
                  }
                  setMobileOpen(false);
                }}
                disabled={isInstalled || !canInstall}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-[10px] text-[#a78bfa] text-sm font-semibold transition-all font-[inherit] pwa-install-btn disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(139, 92, 246, 0.09)',
                  border: '1px solid rgba(139, 92, 246, 0.22)',
                }}
              >
                <InstallIcon size={16} />
                {isInstalled ? 'مثبت' : 'تثبيت التطبيق'}
              </button>

              <button
                onClick={handleLogout}
                disabled={logging}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-[10px] bg-red-500/8 border border-red-500/18 text-red-400 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-70 font-[inherit]"
              >
                {logging ? (
                  <div className="w-4 h-4 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />
                ) : (
                  <LogOutIcon size={16} />
                )}
                {logging ? 'جاري الخروج...' : 'تسجيل الخروج'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── نافذة إرشادات التثبيت على الآيفون iOS ── */}
      {showIOSModal && (
        <div 
          dir="rtl"
          className="fixed inset-0 flex items-center justify-center p-4 animate-fade-in"
          style={{ fontFamily: 'inherit', zIndex: 99999 }}
        >
          {/* Backdrop blur with fade anim */}
          <div 
            onClick={() => setShowIOSModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
          />
          
          {/* Content container with bounce/scale-in effect */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pwaModalScale {
              from {
                opacity: 0;
                transform: scale(0.93) translateY(12px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
          `}} />
          <div 
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 p-6 shadow-2xl backdrop-blur-xl transition-all"
            style={{
              animation: 'pwaModalScale 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.3)',
              background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.98) 100%)',
            }}
          >
            {/* Elegant Top Glow Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
            
            {/* Header info */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span className="text-xl">📱</span>
                  تثبيت التطبيق على آيفون (iOS)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  اتبع هذه الخطوات البسيطة لإضافة التطبيق إلى الشاشة الرئيسية وتفعيل الإشعارات:
                </p>
              </div>
              <button 
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors border border-white/10 flex items-center justify-center"
              >
                <CloseIcon size={15} />
              </button>
            </div>

            {/* List of Steps */}
            <div className="space-y-4 mb-6">
              {/* Step 1 */}
              <div className="flex items-start gap-3.5 bg-white/2 hover:bg-white/4 p-3.5 rounded-xl border border-white/5 transition-all">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.15)] font-bold text-sm">
                  ١
                </div>
                <div className="text-sm text-slate-200 leading-relaxed font-medium">
                  اضغط على زر **المشاركة** 
                  <span className="inline-flex items-center justify-center p-1 bg-white/10 border border-white/15 rounded-md mx-1 text-slate-100 align-middle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </span> 
                  الموجود في أسفل متصفح Safari.
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="flex items-start gap-3.5 bg-white/2 hover:bg-white/4 p-3.5 rounded-xl border border-white/5 transition-all">
                <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.15)] font-bold text-sm">
                  ٢
                </div>
                <div className="text-sm text-slate-200 leading-relaxed font-medium font-sans">
                  مرر خيارات القائمة لأسفل ثم اضغط على **"إضافة إلى الشاشة الرئيسية"** 
                  <span className="inline-flex items-center justify-center p-1 bg-white/10 border border-white/15 rounded-md mx-1 text-slate-100 align-middle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </span>.
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 bg-white/2 hover:bg-white/4 p-3.5 rounded-xl border border-white/5 transition-all">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-bold text-sm">
                  ٣
                </div>
                <div className="text-sm text-slate-200 leading-relaxed font-medium">
                  انقر على زر **"إضافة" (Add)** في الزاوية العلوية اليمنى لإتمام التثبيت بنجاح.
                </div>
              </div>
            </div>

            {/* Footer action button */}
            <button 
              onClick={() => setShowIOSModal(false)}
              className="w-full flex items-center justify-center py-2.5 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm border-none shadow-[0_8px_16px_rgba(99,102,241,0.25)] transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
}

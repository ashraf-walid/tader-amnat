"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldIcon,
  UserIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  LogInIcon,
  WhatsAppIcon,
} from "@/components/Icons";
// import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, remember }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "اسم المستخدم أو كلمة المرور غير صحيحة");
        setLoading(false);
        return;
      }
      // Redirect based on role
      const role = data.user?.role;
      if (role === "admin" || role === "owner") {
        router.push("/admin");
      } else if (role === "employee") {
        router.push("/");
      } else if (role === "client") {
        router.push("/client/balance");
      } else {
        router.push("/Storagecalculator");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال بالخادم");
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans bg-[var(--background,#f0f6ff)] text-[var(--foreground,#171717)] text-right"
    >
      {/* ── خلفية الشبكة ── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(var(--border, #e2e8f0) 1px, transparent 1px), linear-gradient(90deg, var(--border, #e2e8f0) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── نقاط الضوء ── */}
      <div
        aria-hidden="true"
        className="fixed w-[480px] h-[480px] rounded-full bg-[#2563eb] blur-[100px] opacity-[0.12] -top-[140px] -right-[100px] z-0"
      />
      <div
        aria-hidden="true"
        className="fixed w-80 h-80 rounded-full bg-[#60a5fa] blur-[80px] opacity-10 -bottom-20 -left-[60px] z-0"
      />

      {/* ── المحتوى الرئيسي ── */}
      <main className="relative z-10 w-full max-w-[460px] px-4 py-6 flex flex-col items-center">

        {/* ── زر تبديل الثيم ── */}
        {/* <div className="absolute top-4 left-4">
          <ThemeToggle />
        </div> */}

        {/* ── رأس العلامة التجارية ── */}
        <div className="text-center mb-7">
          <h1 className="text-[22px] font-bold text-[var(--foreground,#171717)] tracking-tight leading-tight m-0">
            نظام إدارة الفواتير
          </h1>
          <p className="text-[13.5px] text-[var(--muted,#64748b)] mt-1.5 font-normal">
            أرضيات الحاويات الواردة
          </p>
        </div>

        {/* ── البطاقة ── */}
        <div
          className="w-full backdrop-blur-[20px] rounded-[20px] px-8 pt-9 pb-8"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            boxShadow: "var(--card-shadow)",
          }}
        >

          {/* شارة الأمان */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-1.5 bg-blue-600/[0.08] text-[var(--primary,#2563eb)] border border-blue-600/[0.18] rounded-full px-3 py-1 text-[11.5px] font-medium">
              <ShieldIcon size={13} />
              دخول آمن ومشفّر
            </div>
          </div>

          <h2 className="text-lg font-semibold text-[var(--foreground,#171717)] m-0 mb-1.5 text-right">
            تسجيل الدخول
          </h2>
          <p className="text-[13.5px] text-[var(--muted,#64748b)] m-0 mb-4 font-normal text-right">
            أدخل بياناتك للوصول إلى لوحة التحكم
          </p>
          <div className="w-10 h-[3px] bg-gradient-to-r from-[#2563eb] to-[#60a5fa] rounded-sm mb-[22px]" />

          {/* رسالة الخطأ */}
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 bg-red-500/[0.08] border border-red-500/25 rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#dc2626] mb-4 text-right"
            >
              <AlertCircleIcon size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* حقل اسم المستخدم */}
          <div className="mb-[18px]">
            <label htmlFor="username" className="block text-[13px] font-medium text-[var(--foreground,#171717)] mb-[7px] text-right">
              اسم المستخدم
            </label>
            <div className="relative">
              <div
                aria-hidden="true"
                className={`absolute top-1/2 right-3.5 -translate-y-1/2 flex items-center pointer-events-none transition-colors duration-200 ${
                  username ? "text-[var(--primary,#2563eb)]" : "text-[var(--muted,#64748b)]"
                }`}
              >
                <UserIcon size={18} />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                placeholder="أدخل اسم المستخدم"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                aria-required="true"
                dir="rtl"
                className="login-input w-full h-[46px] pr-11 pl-3.5 text-[14.5px] font-normal text-[var(--foreground,#171717)] bg-[var(--secondary,#f1f5f9)] border-[1.5px] border-[var(--border,#e2e8f0)] rounded-xl outline-none text-right box-border transition-all duration-200"
              />
            </div>
          </div>

          {/* حقل كلمة المرور */}
          <div className="mb-5">
            <label htmlFor="password" className="block text-[13px] font-medium text-[var(--foreground,#171717)] mb-[7px] text-right">
              كلمة المرور
            </label>
            <div className="relative">
              <div
                aria-hidden="true"
                className={`absolute top-1/2 right-3.5 -translate-y-1/2 flex items-center pointer-events-none transition-colors duration-200 ${
                  password ? "text-[var(--primary,#2563eb)]" : "text-[var(--muted,#64748b)]"
                }`}
              >
                <LockIcon size={18} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
                aria-required="true"
                dir="rtl"
                className="login-input w-full h-[46px] pr-11 pl-11 text-[14.5px] font-normal text-[var(--foreground,#171717)] bg-[var(--secondary,#f1f5f9)] border-[1.5px] border-[var(--border,#e2e8f0)] rounded-xl outline-none text-right box-border transition-all duration-200"
              />
              {/* زر إظهار/إخفاء كلمة المرور */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                className="absolute top-1/2 left-3 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[var(--muted,#64748b)] p-1 flex items-center rounded-md"
              >
                {showPassword ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
              </button>
            </div>
          </div>

          {/* صف الخيارات */}
          <div className="flex items-center justify-between mb-[22px]">
            <label className="flex items-center gap-1.5 text-[13px] text-[var(--muted,#64748b)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 accent-[var(--primary,#2563eb)] cursor-pointer"
              />
              تذكّرني
            </label>
            <a href="https://wa.me/201000980788?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D8%B3%D8%AA%D8%B9%D8%A7%D8%AF%D8%A9%20%D9%83%D9%84%D9%85%D8%A9%20%D8%A7%D9%84%D9%85%D8%B1%D9%88%D8%B1" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[var(--primary,#2563eb)] no-underline font-medium hover:underline">
              نسيت كلمة المرور؟
            </a>
          </div>

          {/* زر الدخول */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            aria-label="تسجيل الدخول"
            className="w-full h-12 bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] text-white border-none rounded-xl text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_18px_rgba(37,99,235,0.32)] disabled:opacity-80 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-[0_6px_24px_rgba(37,99,235,0.4)] hover:-translate-y-px active:translate-y-0"
          >
            {loading ? (
              <div className="w-5 h-5 border-[2.5px] border-white/35 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>دخول إلى النظام</span>
                <LogInIcon size={18} />
              </>
            )}
          </button>
        </div>

        {/* تذييل الصفحة */}
        <div className="text-center mt-5 text-xs text-[var(--muted,#64748b)]">
          <span className="text-[var(--primary,#2563eb)] font-medium">
            نظام أرضيات الحاويات
          </span>{" "}
          — جميع الحقوق محفوظة &copy; 2025
        </div>

        {/* رابط إنشاء حساب */}
        <div
          className="mt-4 text-center px-5 py-3.5 backdrop-blur-xl rounded-[14px]"
          style={{
            background: "var(--footer-card-bg)",
            border: "1px solid var(--footer-card-border)",
          }}
        >
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-[13px] text-[var(--muted,#64748b)]">
              ليس لديك حساب؟
            </span>
            <a
              href="https://wa.me/201000980788?text=السلام%20عليكم%20اعملى%20حساب%20على%20برنامج%20الارضيات%20.."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#25D366] no-underline px-3 py-1.5 bg-[#25D366]/[0.08] border border-[#25D366]/20 rounded-lg transition-all duration-200 hover:bg-[#25D366]/[0.15] hover:-translate-y-px"
            >
              <WhatsAppIcon size={16} className="shrink-0" />
              تواصل مع الإدارة
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

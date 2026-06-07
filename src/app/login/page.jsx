"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        body: JSON.stringify({ username: username.trim(), password }),
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
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif",
        background: "var(--background, #f0f6ff)",
        color: "var(--foreground, #171717)",
        direction: "rtl",
        textAlign: "right",
      }}
    >
      {/* ── خلفية الشبكة ── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage:
            "linear-gradient(var(--border, #e2e8f0) 1px, transparent 1px), linear-gradient(90deg, var(--border, #e2e8f0) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.3,
        }}
      />
      {/* ── نقاط الضوء ── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "#2563eb",
          filter: "blur(100px)",
          opacity: 0.12,
          top: -140,
          right: -100,
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "#60a5fa",
          filter: "blur(80px)",
          opacity: 0.1,
          bottom: -80,
          left: -60,
          zIndex: 0,
        }}
      />

      {/* ── المحتوى الرئيسي ── */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 460,
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* ── رأس العلامة التجارية ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {/* <div
            aria-hidden="true"
            style={{
              width: 64,
              height: 64,
              background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: "0 8px 32px rgba(37,99,235,0.28), 0 2px 8px rgba(37,99,235,0.15)",
            }}
          >
            <div className="w-[60px] h-[60px] rounded-[13px] flex items-center justify-center text-[22px] shrink-0">
              ⚓
            </div>
          </div> */}
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--foreground, #171717)",
              letterSpacing: "-0.3px",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            نظام إدارة الفواتير
          </h1>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--muted, #64748b)",
              marginTop: 5,
              fontWeight: 400,
            }}
          >
            أرضيات الحاويات الواردة
          </p>
        </div>

        {/* ── البطاقة ── */}
        <div
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.65)",
            borderRadius: 20,
            padding: "36px 32px 32px",
            boxShadow:
              "0 4px 32px rgba(37,99,235,0.08), 0 1px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {/* شارة الأمان */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(37,99,235,0.08)",
                color: "var(--primary, #2563eb)",
                border: "1px solid rgba(37,99,235,0.18)",
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 11.5,
                fontWeight: 500,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              دخول آمن ومشفّر
            </div>
          </div>

          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--foreground, #171717)",
              margin: "0 0 5px",
              textAlign: "right",
            }}
          >
            تسجيل الدخول
          </h2>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--muted, #64748b)",
              margin: "0 0 16px",
              fontWeight: 400,
              textAlign: "right",
            }}
          >
            أدخل بياناتك للوصول إلى لوحة التحكم
          </p>
          <div
            style={{
              width: 40,
              height: 3,
              background: "linear-gradient(90deg, #2563eb, #60a5fa)",
              borderRadius: 2,
              marginBottom: 22,
            }}
          />

          {/* رسالة الخطأ */}
          {error && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                color: "#dc2626",
                marginBottom: 16,
                textAlign: "right",
                direction: "rtl",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* حقل اسم المستخدم */}
          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="username"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--foreground, #171717)",
                marginBottom: 7,
                textAlign: "right",
              }}
            >
              اسم المستخدم
            </label>
            <div style={{ position: "relative" }}>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 14,
                  transform: "translateY(-50%)",
                  color: username ? "var(--primary, #2563eb)" : "var(--muted, #64748b)",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                  transition: "color 0.2s",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
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
                style={{
                  width: "100%",
                  height: 46,
                  padding: "0 44px 0 14px",
                  fontFamily: "inherit",
                  fontSize: 14.5,
                  fontWeight: 400,
                  color: "var(--foreground, #171717)",
                  background: "var(--secondary, #f1f5f9)",
                  border: "1.5px solid var(--border, #e2e8f0)",
                  borderRadius: 12,
                  outline: "none",
                  direction: "rtl",
                  textAlign: "right",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--ring, #3b82f6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.14)";
                  e.target.style.background = "var(--background, #fff)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border, #e2e8f0)";
                  e.target.style.boxShadow = "none";
                  e.target.style.background = "var(--secondary, #f1f5f9)";
                }}
              />
            </div>
          </div>

          {/* حقل كلمة المرور */}
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--foreground, #171717)",
                marginBottom: 7,
                textAlign: "right",
              }}
            >
              كلمة المرور
            </label>
            <div style={{ position: "relative" }}>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 14,
                  transform: "translateY(-50%)",
                  color: password ? "var(--primary, #2563eb)" : "var(--muted, #64748b)",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                  transition: "color 0.2s",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
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
                style={{
                  width: "100%",
                  height: 46,
                  padding: "0 44px 0 44px",
                  fontFamily: "inherit",
                  fontSize: 14.5,
                  fontWeight: 400,
                  color: "var(--foreground, #171717)",
                  background: "var(--secondary, #f1f5f9)",
                  border: "1.5px solid var(--border, #e2e8f0)",
                  borderRadius: 12,
                  outline: "none",
                  direction: "rtl",
                  textAlign: "right",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--ring, #3b82f6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.14)";
                  e.target.style.background = "var(--background, #fff)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border, #e2e8f0)";
                  e.target.style.boxShadow = "none";
                  e.target.style.background = "var(--secondary, #f1f5f9)";
                }}
              />
              {/* زر إظهار/إخفاء كلمة المرور */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 12,
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted, #64748b)",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 6,
                }}
              >
                {showPassword ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* صف الخيارات */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 22,
              direction: "rtl",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 13,
                color: "var(--muted, #64748b)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--primary, #2563eb)", cursor: "pointer" }}
              />
              تذكّرني
            </label>
            <a
              href="#"
              style={{
                fontSize: 13,
                color: "var(--primary, #2563eb)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              نسيت كلمة المرور؟
            </a>
          </div>

          {/* زر الدخول */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            aria-label="تسجيل الدخول"
            style={{
              width: "100%",
              height: 48,
              background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 18px rgba(37,99,235,0.32)",
              opacity: loading ? 0.8 : 1,
              transition: "transform 0.15s, box-shadow 0.2s",
              direction: "rtl",
            }}
          >
            {loading ? (
              <div
                aria-hidden="true"
                style={{
                  width: 20,
                  height: 20,
                  border: "2.5px solid rgba(255,255,255,0.35)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            ) : (
              <>
                <span>دخول إلى النظام</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* تذييل الصفحة */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 12,
            color: "var(--muted, #64748b)",
            direction: "rtl",
          }}
        >
          <span style={{ color: "var(--primary, #2563eb)", fontWeight: 500 }}>
            نظام أرضيات الحاويات
          </span>{" "}
          — جميع الحقوق محفوظة &copy; 2025
        </div>

        {/* رابط إنشاء حساب */}
        <div
          style={{
            marginTop: 16,
            textAlign: "center",
            padding: "14px 20px",
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: 14,
            direction: "rtl",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--muted, #64748b)" }}>
              ليس لديك حساب؟
            </span>
            <a
              href="https://wa.me/201000980788?text=السلام%20عليكم%20اعملى%20حساب%20على%20برنامج%20الارضيات%20باسم ...."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#25D366",
                textDecoration: "none",
                padding: "6px 12px",
                background: "rgba(37,211,102,0.08)",
                border: "1px solid rgba(37,211,102,0.2)",
                borderRadius: 8,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(37,211,102,0.15)";
                e.target.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(37,211,102,0.08)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ flexShrink: 0 }}
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              تواصل مع الإدارة
            </a>
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
}

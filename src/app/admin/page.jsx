"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/Icons";
import { PROJECT_FILES, ROLES, getRoleInfo, EMPTY_FORM } from "@/lib/adminConstants";
import AdminNav from "@/components/AdminNav";

// ─── مكوّن حقل الإدخال ────────────────────────────────────────────────────────
function Field({ label, icon: IconComp, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#8892a4",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {IconComp && (
          <span style={{ color: "#60a5fa" }}>
            <IconComp />
          </span>
        )}
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: "#f87171" }}>{error}</span>}
    </div>
  );
}

// ─── حقل نصي موحّد ────────────────────────────────────────────────────────────
function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  step,
  min,
  suffix,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      style={{ position: "relative", display: "flex", alignItems: "center" }}
    >
      <input
        className="no-spinner"
        type={type}
        step={step}
        min={min}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "10px 12px",
          fontSize: 14,
          background: "#0d1424",
          border: `1.5px solid ${focused ? "#60a5fa" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 8,
          color: "#f0f2f8",
          outline: "none",
          direction: "rtl",
          fontFamily: "'Tajawal', system-ui, sans-serif",
          transition: "border-color 0.2s",
          paddingLeft: suffix ? 44 : 12,
        }}
      />
      {suffix && (
        <span
          style={{
            position: "absolute",
            left: 12,
            fontSize: 12,
            color: "#8892a4",
            pointerEvents: "none",
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

// ─── زر رئيسي ─────────────────────────────────────────────────────────────────
function Btn({
  onClick,
  disabled,
  children,
  variant = "primary",
  size = "md",
  title,
}) {
  const colors = {
    primary: {
      bg: "#0ea5e9",
      hover: "#0284c7",
      shadow: "rgba(14,165,233,0.3)",
    },
    success: { bg: "#059669", hover: "#047857", shadow: "rgba(5,150,105,0.3)" },
    danger: { bg: "#dc2626", hover: "#b91c1c", shadow: "rgba(220,38,38,0.3)" },
    ghost: {
      bg: "rgba(255,255,255,0.06)",
      hover: "rgba(255,255,255,0.12)",
      shadow: "none",
    },
    gold: { bg: "#d97706", hover: "#b45309", shadow: "rgba(217,119,6,0.3)" },
  };
  const c = colors[variant];
  const pad =
    size === "sm" ? "6px 12px" : size === "xs" ? "4px 8px" : "10px 18px";
  const fs = size === "sm" || size === "xs" ? 12 : 14;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: pad,
        fontSize: fs,
        fontWeight: 600,
        background: c.bg,
        color: "#fff",
        border: "none",
        borderRadius: 7,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        transition: "background 0.15s, transform 0.1s",
        boxShadow: c.shadow !== "none" ? `0 4px 12px ${c.shadow}` : "none",
        fontFamily: "'Tajawal', system-ui, sans-serif",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) =>
        !disabled && (e.currentTarget.style.background = c.hover)
      }
      onMouseLeave={(e) =>
        !disabled && (e.currentTarget.style.background = c.bg)
      }
      onMouseDown={(e) =>
        !disabled && (e.currentTarget.style.transform = "scale(0.97)")
      }
      onMouseUp={(e) =>
        !disabled && (e.currentTarget.style.transform = "scale(1)")
      }
    >
      {children}
    </button>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a2035",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "28px 24px",
          width: "100%",
          maxWidth: 480,
          direction: "rtl",
          fontFamily: "'Tajawal', system-ui, sans-serif",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          animation: "slideUp 0.22s cubic-bezier(0.22,1,0.36,1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#f0f2f8",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#8892a4",
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
          >
            <Icon.Close />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── شارة الدور ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const r = getRoleInfo(role);
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11.5,
        fontWeight: 600,
        color: r.color,
        background: r.bg,
        border: `1px solid ${r.color}28`,
        whiteSpace: "nowrap",
      }}
    >
      {r.label}
    </span>
  );
}

// ─── شارة المحاولات ───────────────────────────────────────────────────────────
function AttemptsBadge({ attempts }) {
  const color =
    attempts === 0 ? "#f87171" : attempts <= 3 ? "#fbbf24" : "#34d399";
  const bg =
    attempts === 0
      ? "rgba(248,113,113,0.1)"
      : attempts <= 3
        ? "rgba(251,191,36,0.1)"
        : "rgba(52,211,153,0.1)";
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11.5,
        fontWeight: 700,
        color,
        background: bg,
        border: `1px solid ${color}30`,
      }}
    >
      {attempts === 0 ? "منتهية" : `${attempts} محاولة`}
    </span>
  );
}

// ─── نموذج الحساب ─────────────────────────────────────────────────────────────

function AccountForm({ initial, onSubmit, onCancel, isSaving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "مطلوب";
    if (!initial && !form.password) e.password = "مطلوب";
    if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone))
      e.phone = "رقم غير صحيح";
    if (!form.attempts || form.attempts < 0) e.attempts = "قيمة غير صحيحة";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => validate() && onSubmit(form);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* اسم المستخدم */}
      <Field label="اسم المستخدم" icon={Icon.User} error={errors.username}>
        <Input
          value={form.username}
          onChange={set("username")}
          placeholder="أدخل اسم المستخدم"
        />
      </Field>

      {/* كلمة المرور */}
      <Field
        label={
          initial
            ? "كلمة المرور الجديدة (اتركها فارغة إن لم تغيّرها)"
            : "كلمة المرور"
        }
        icon={Icon.Lock}
        error={errors.password}
      >
        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            value={form.password}
            onChange={set("password")}
            placeholder="••••••••"
            style={{
              width: "100%",
              padding: "10px 12px",
              paddingLeft: 38,
              fontSize: 14,
              background: "#0d1424",
              border: "1.5px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#f0f2f8",
              outline: "none",
              direction: "rtl",
              fontFamily: "'Tajawal', system-ui, sans-serif",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#60a5fa")}
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(255,255,255,0.1)")
            }
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "#8892a4",
              cursor: "pointer",
              display: "flex",
            }}
          >
            {showPass ? <Icon.EyeOff /> : <Icon.Eye />}
          </button>
        </div>
      </Field>

      {/* رقم الهاتف */}
      <Field label="رقم الهاتف" icon={Icon.Phone} error={errors.phone}>
        <Input
          value={form.phone}
          onChange={set("phone")}
          placeholder="01xxxxxxxxx"
        />
      </Field>

      {/* الدور */}
      <Field label="الدور" icon={Icon.Shield}>
        <select
          value={form.role}
          onChange={set("role")}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 14,
            background: "#0d1424",
            border: "1.5px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#f0f2f8",
            outline: "none",
            direction: "rtl",
            fontFamily: "'Tajawal', system-ui, sans-serif",
            cursor: "pointer",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#60a5fa")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>

      {/* عدد المحاولات */}
      <Field
        label="عدد المحاولات المتاحة"
        icon={Icon.Hash}
        error={errors.attempts}
      >
        <Input
          type="number"
          min="0"
          step="1"
          value={form.attempts}
          onChange={set("attempts")}
          placeholder="5"
          suffix="محاولة"
        />
      </Field>

      {/* أزرار */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 6,
          justifyContent: "flex-end",
        }}
      >
        <Btn variant="ghost" onClick={onCancel}>
          إلغاء
        </Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? <Spinner /> : <Icon.Check />}
          {isSaving
            ? "جاري الحفظ..."
            : initial
              ? "حفظ التعديلات"
              : "إضافة الحساب"}
        </Btn>
      </div>
    </div>
  );
}

// ─── مؤشر التحميل ─────────────────────────────────────────────────────────────
function Spinner({ size = 14 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid rgba(255,255,255,0.25)`,
        borderTopColor: "#fff",
        animation: "spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg.text) return null;
  const isErr = msg.type === "error";
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 20px",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        background: isErr ? "#1f0a0a" : "#0a1f15",
        border: `1px solid ${isErr ? "rgba(248,113,113,0.4)" : "rgba(52,211,153,0.4)"}`,
        color: isErr ? "#f87171" : "#34d399",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        animation: "slideUp 0.25s cubic-bezier(0.22,1,0.36,1)",
        fontFamily: "'Tajawal', system-ui, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {isErr ? "✕" : "✓"} {msg.text}
    </div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function AdminPage() {
  // ── سعر الصرف ──
  const [rate, setRate] = useState("");
  const [rateLoading, setRL] = useState(true);
  const [rateSaving, setRS] = useState(false);

  // ── الحسابات ──
  const [accounts, setAccounts] = useState([]);
  const [accLoading, setAL] = useState(true);

  // ── واجهة ──
  const [tab, setTab] = useState("accounts"); // 'accounts' | 'rate' | 'structure'
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'delete' | 'attempts'
  const [selected, setSelected] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ text: "", type: "" });
  const [newAttempts, setNewAttempts] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [structSearch, setStructSearch] = useState("");
  const [structType, setStructType] = useState("all"); // 'all' | 'page' | 'api' | 'core'

  const notify = (text, type = "success") => setToast({ text, type });

  // ── تحميل سعر الصرف ──
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRate(d.exchangeRate);
      })
      .catch(() => {})
      .finally(() => setRL(false));
  }, []);

  // ── تحميل الحسابات ──
  const loadAccounts = () => {
    setAL(true);
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAccounts(d.accounts);
      })
      .catch(() => {})
      .finally(() => setAL(false));
  };
  useEffect(loadAccounts, []);

  // ── حفظ سعر الصرف ──
  const saveRate = async () => {
    setRS(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchangeRate: Number(rate) }),
      });
      const d = await res.json();
      d.success
        ? notify("تم حفظ سعر الصرف بنجاح")
        : notify(d.error || "خطأ", "error");
    } catch {
      notify("فشل الاتصال بالخادم", "error");
    } finally {
      setRS(false);
    }
  };

  // ── إضافة حساب ──
  const addAccount = async (form) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.success) {
        notify("تم إضافة الحساب بنجاح");
        setModal(null);
        loadAccounts();
      } else notify(d.error || "خطأ في الإضافة", "error");
    } catch {
      notify("فشل الاتصال", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── تعديل حساب ──
  const editAccount = async (form) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.success) {
        notify("تم تحديث الحساب");
        setModal(null);
        loadAccounts();
      } else notify(d.error || "خطأ", "error");
    } catch {
      notify("فشل الاتصال", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── حذف حساب ──
  const deleteAccount = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (d.success) {
        notify("تم حذف الحساب");
        setModal(null);
        setDeleteConfirm("");
        loadAccounts();
      } else notify(d.error || "خطأ", "error");
    } catch {
      notify("فشل الاتصال", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── تجديد المحاولات ──
  const renewAttempts = async () => {
    const n = Number(newAttempts);
    if (!n || n < 0) return notify("أدخل رقماً صحيحاً", "error");
    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}/attempts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attempts: n }),
      });
      const d = await res.json();
      if (d.success) {
        notify(`تم منح ${n} محاولات للمستخدم ${selected.username}`);
        setModal(null);
        setNewAttempts("");
        loadAccounts();
      } else notify(d.error || "خطأ", "error");
    } catch {
      notify("فشل الاتصال", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── فلترة ──
  const filtered = accounts.filter((a) => {
    const matchRole = roleFilter === "all" || a.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q || a.username.toLowerCase().includes(q) || (a.phone || "").includes(q);
    return matchRole && matchSearch;
  });

  // ── إحصاء ──
  const stats = {
    total: accounts.length,
    clients: accounts.filter((a) => a.role === "client").length,
    active: accounts.filter((a) => (a.attempts || 0) > 0).length,
    depleted: accounts.filter((a) => (a.attempts || 0) === 0).length,
  };

  // ── Tab زر ──
  const TabBtn = ({ id, children }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: "10px 20px",
        fontSize: 13.5,
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        borderRadius: 8,
        transition: "background 0.15s, color 0.15s",
        background: tab === id ? "#0ea5e9" : "rgba(255,255,255,0.05)",
        color: tab === id ? "#fff" : "#8892a4",
        fontFamily: "'Tajawal', system-ui, sans-serif",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        boxShadow: tab === id ? "0 4px 12px rgba(14,165,233,0.3)" : "none",
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      dir="rtl"
      lang="ar"
      style={{
        minHeight: "100vh",
        background: "#0d1424",
        fontFamily: "'Tajawal', system-ui, sans-serif",
        color: "#f0f2f8",
        padding: "24px 16px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        select option { background: #1a2035; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 1; }

        .admin-header { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:4px; }
        .admin-header-title { display:flex; align-items:center; gap:10px; }
        .admin-nav { display:flex; gap:6px; flex-wrap:wrap; }
        .admin-nav a, .admin-nav button { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; font-size:12px; font-weight:600; border-radius:8px; text-decoration:none; transition:all 0.2s; white-space:nowrap; cursor:pointer; font-family:inherit; }

        @media (max-width: 640px) {
          .admin-header { flex-direction:column; align-items:flex-start; gap:14px; }
          .admin-nav { width:100%; flex-direction:row; flex-wrap:wrap; gap:6px; }
          .admin-nav a, .admin-nav button { flex:1 1 auto; justify-content:center; min-width:0; padding:8px 10px; font-size:11px; }
        }
      `}</style>

      <AdminNav />

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* ─── رأس الصفحة ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div className="admin-header">
            <div className="admin-header-title">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #0ea5e9, #818cf8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(14,165,233,0.3)",
                  flexShrink: 0,
                }}
              >
                <Icon.Shield />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    margin: 0,
                    color: "#f0f2f8",
                  }}
                >
                  لوحة الإدارة
                </h1>
                <p style={{ fontSize: 12.5, color: "#8892a4", margin: 0 }}>
                  نظام أرضيات الحاويات الواردة
                </p>
              </div>
            </div>

            {/* ─── أزرار التنقل ─── */}
            <nav className="admin-nav">
              {[
                { href: "/", label: "الرئيسية", color: "#818cf8" },
                { href: "/Storagecalculator", label: "حاسبة التخزين", color: "#f0b429" },
                { href: "/Storagecalculator/rates", label: "التعريفات", color: "#60a5fa" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    color: link.color,
                    background: `${link.color}15`,
                    border: `1px solid ${link.color}30`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${link.color}25`;
                    e.currentTarget.style.borderColor = `${link.color}50`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${link.color}15`;
                    e.currentTarget.style.borderColor = `${link.color}30`;
                  }}
                >
                  {link.label}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                </a>
              ))}
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  } catch {}
                }}
                style={{
                  color: "#f87171",
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.25)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(248,113,113,0.2)";
                  e.currentTarget.style.borderColor = "rgba(248,113,113,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(248,113,113,0.1)";
                  e.currentTarget.style.borderColor = "rgba(248,113,113,0.25)";
                }}
              >
                خروج
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </nav>
          </div>
        </div>

        {/* ─── بطاقات الإحصاء ─────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {[
            {
              label: "إجمالي الحسابات",
              value: stats.total,
              color: "#818cf8",
              icon: Icon.Users,
            },
            {
              label: "حسابات العملاء",
              value: stats.clients,
              color: "#60a5fa",
              icon: Icon.User,
            },
            {
              label: "محاولات متاحة",
              value: stats.active,
              color: "#34d399",
              icon: Icon.Check,
            },
            {
              label: "محاولات منتهية",
              value: stats.depleted,
              color: "#f87171",
              icon: Icon.Hash,
            },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: "#1a2035",
                borderRadius: 10,
                padding: "12px 14px",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      fontSize: 10.5,
                      color: "#8892a4",
                      margin: "0 0 5px",
                      fontWeight: 500,
                      lineHeight: 1.3,
                      wordBreak: "break-word",
                    }}
                  >
                    {s.label}
                  </p>
                  <p
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      margin: 0,
                      color: s.color,
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </p>
                </div>
                <div style={{ color: s.color, opacity: 0.6, flexShrink: 0 }}>
                  <div style={{ transform: "scale(0.85)" }}>
                    <s.icon />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── تبويبات ────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <TabBtn id="accounts">
            <Icon.Users /> إدارة الحسابات
          </TabBtn>
          <TabBtn id="rate">
            <Icon.Currency /> سعر الصرف
          </TabBtn>
          <TabBtn id="structure">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginLeft: 2 }}
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            هيكل المشروع
          </TabBtn>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            تبويب: إدارة الحسابات
        ═══════════════════════════════════════════════════════════ */}
        {tab === "accounts" && (
          <div
            style={{
              background: "#1a2035",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            {/* شريط الأدوات */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "center",
              }}
            >
              {/* بحث */}
              <div
                style={{
                  position: "relative",
                  flex: "1 1 180px",
                  minWidth: 140,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    right: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#8892a4",
                    fontSize: 13,
                  }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الهاتف..."
                  style={{
                    width: "100%",
                    padding: "8px 32px 8px 12px",
                    fontSize: 13,
                    background: "#0d1424",
                    border: "1.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#f0f2f8",
                    outline: "none",
                    direction: "rtl",
                    fontFamily: "'Tajawal', system-ui, sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#60a5fa")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                  }
                />
              </div>

              {/* فلتر الدور */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  fontSize: 13,
                  flex: "0 0 auto",
                  background: "#0d1424",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#f0f2f8",
                  outline: "none",
                  direction: "rtl",
                  fontFamily: "'Tajawal', system-ui, sans-serif",
                  cursor: "pointer",
                }}
              >
                <option value="all">كل الأدوار</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>

              {/* تحديث */}
              <Btn variant="ghost" size="sm" onClick={loadAccounts}>
                <Icon.Refresh /> تحديث
              </Btn>

              {/* إضافة */}
              <Btn variant="primary" size="sm" onClick={() => setModal("add")}>
                <Icon.Plus /> إضافة حساب
              </Btn>
            </div>

            {/* جدول الحسابات */}
            {accLoading ? (
              <div
                style={{ textAlign: "center", padding: 48, color: "#8892a4" }}
              >
                <Spinner size={28} /> <br />
                <br /> جاري التحميل...
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 48,
                  color: "#8892a4",
                  fontSize: 14,
                }}
              >
                {accounts.length === 0
                  ? "لا توجد حسابات بعد — أضف حساباً جديداً"
                  : "لا توجد نتائج للبحث"}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    direction: "rtl",
                    minWidth: 640,
                  }}
                >
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                      {[
                        "اسم المستخدم",
                        "رقم الهاتف",
                        "الدور",
                        "المحاولات",
                        "الفواتير",
                        "الإجراءات",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 16px",
                            textAlign: "right",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#8892a4",
                            borderBottom: "1px solid rgba(255,255,255,0.07)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((acc, idx) => (
                      <tr
                        key={acc.id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          background:
                            idx % 2 === 0
                              ? "transparent"
                              : "rgba(255,255,255,0.015)",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(96,165,250,0.06)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            idx % 2 === 0
                              ? "transparent"
                              : "rgba(255,255,255,0.015)")
                        }
                      >
                        {/* الاسم */}
                        <td style={{ padding: "14px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: `${getRoleInfo(acc.role).bg}`,
                                border: `1px solid ${getRoleInfo(acc.role).color}30`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                fontWeight: 700,
                                color: getRoleInfo(acc.role).color,
                              }}
                            >
                              {acc.username?.[0]?.toUpperCase() || "؟"}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: "#f0f2f8",
                                }}
                              >
                                {acc.username}
                              </div>
                              <div style={{ fontSize: 11, color: "#8892a4" }}>
                                #{acc.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* الهاتف */}
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            color: "#94a3b8",
                            direction: "ltr",
                            textAlign: "right",
                          }}
                        >
                          {acc.phone || "—"}
                        </td>

                        {/* الدور */}
                        <td style={{ padding: "14px 16px" }}>
                          <RoleBadge role={acc.role} />
                        </td>

                        {/* المحاولات */}
                        <td style={{ padding: "14px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <AttemptsBadge attempts={acc.attempts || 0} />
                            <button
                              title="تجديد المحاولات"
                              onClick={() => {
                                setSelected(acc);
                                setNewAttempts("");
                                setModal("attempts");
                              }}
                              style={{
                                background: "rgba(14,165,233,0.12)",
                                border: "none",
                                cursor: "pointer",
                                color: "#0ea5e9",
                                padding: 5,
                                borderRadius: 6,
                                display: "flex",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(14,165,233,0.25)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(14,165,233,0.12)")
                              }
                            >
                              <Icon.Refresh />
                            </button>
                          </div>
                        </td>

                        {/* الفواتير */}
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "3px 10px",
                              borderRadius: 20,
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: "#f0b429",
                              background: "rgba(240,180,41,0.1)",
                              border: "1px solid rgba(240,180,41,0.25)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {acc.calculationsCount || 0} فاتورة
                          </span>
                        </td>

                        {/* الإجراءات */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Btn
                              size="xs"
                              variant="ghost"
                              title="تعديل"
                              onClick={() => {
                                setSelected(acc);
                                setModal("edit");
                              }}
                            >
                              <Icon.Edit /> تعديل
                            </Btn>
                            {acc.role !== "owner" && (
                              <Btn
                                size="xs"
                                variant="danger"
                                title="حذف"
                                onClick={() => {
                                  setSelected(acc);
                                  setDeleteConfirm("");
                                  setModal("delete");
                                }}
                              >
                                <Icon.Trash /> حذف
                              </Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* تذييل الجدول */}
            {!accLoading && accounts.length > 0 && (
              <div
                style={{
                  padding: "10px 20px",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  fontSize: 12,
                  color: "#8892a4",
                  textAlign: "left",
                }}
              >
                عرض {filtered.length} من {accounts.length} حساب
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            تبويب: سعر الصرف
        ═══════════════════════════════════════════════════════════ */}
        {tab === "rate" && (
          <div
            style={{
              background: "#1a2035",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "32px 28px",
              maxWidth: 480,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <div style={{ color: "#f0b429" }}>
                <Icon.Currency />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                إدارة سعر الصرف
              </h2>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#8892a4",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              سعر الصرف الرسمي المستخدم في حساب فواتير أرضيات الحاويات الواردة.
            </p>

            {rateLoading ? (
              <div
                style={{ textAlign: "center", padding: 24, color: "#8892a4" }}
              >
                <Spinner />
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                <Field
                  label="سعر الصرف الحالي  (ج.م / دولار)"
                  icon={Icon.Currency}
                >
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.1"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        paddingLeft: 52,
                        fontSize: 22,
                        fontWeight: 800,
                        letterSpacing: "0.5px",
                        background: "#0d1424",
                        border: "1.5px solid rgba(255,255,255,0.12)",
                        borderRadius: 10,
                        color: "#f0b429",
                        outline: "none",
                        direction: "rtl",
                        fontFamily: "'Tajawal', system-ui, sans-serif",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#f0b429")}
                      onBlur={(e) =>
                        (e.target.style.borderColor = "rgba(255,255,255,0.12)")
                      }
                    />
                    <span
                      style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 12.5,
                        color: "#8892a4",
                        fontWeight: 600,
                        pointerEvents: "none",
                      }}
                    >
                      ج.م / $
                    </span>
                  </div>
                </Field>
                <Btn variant="gold" onClick={saveRate} disabled={rateSaving}>
                  {rateSaving ? <Spinner /> : <Icon.Check />}
                  {rateSaving ? "جاري الحفظ..." : "حفظ سعر الصرف"}
                </Btn>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            تبويب: هيكل المشروع
        ═══════════════════════════════════════════════════════════ */}
        {tab === "structure" &&
          (() => {
            const filteredFiles = PROJECT_FILES.filter((f) => {
              const matchType = structType === "all" || f.type === structType;
              const q = structSearch.toLowerCase();
              return (
                matchType &&
                (!q ||
                  f.name.toLowerCase().includes(q) ||
                  f.path.toLowerCase().includes(q) ||
                  f.desc.toLowerCase().includes(q))
              );
            });

            return (
              <div
                style={{
                  background: "#1a2035",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "24px 20px",
                  animation: "slideUp 0.2s ease-out",
                }}
              >
                {/* الرأس */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8,
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    paddingBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(96,165,250,0.12)",
                      color: "#60a5fa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        margin: 0,
                        color: "#f0f2f8",
                      }}
                    >
                      دليل ملفات المشروع والـ APIs
                    </h2>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#8892a4",
                        margin: "4px 0 0",
                      }}
                    >
                      مستند تفصيلي يستعرض الصفحات النشطة والـ APIs والمكتبات
                      الأساسية للمشروع.
                    </p>
                  </div>
                </div>

                {/* عناصر التصفية والبحث */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 16,
                    marginBottom: 20,
                  }}
                >
                  {/* البحث */}
                  <div
                    style={{
                      position: "relative",
                      flex: "1 1 240px",
                      minWidth: 200,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        right: 11,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#8892a4",
                        fontSize: 13,
                      }}
                    >
                      🔍
                    </span>
                    <input
                      type="text"
                      value={structSearch}
                      onChange={(e) => setStructSearch(e.target.value)}
                      placeholder="ابحث باسم الملف أو المسار أو الفائدة..."
                      style={{
                        width: "100%",
                        padding: "10px 32px 10px 12px",
                        fontSize: 13,
                        background: "#0d1424",
                        border: "1.5px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        color: "#f0f2f8",
                        outline: "none",
                        direction: "rtl",
                        fontFamily: "'Tajawal', system-ui, sans-serif",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#60a5fa")}
                      onBlur={(e) =>
                        (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                      }
                    />
                    {structSearch && (
                      <button
                        onClick={() => setStructSearch("")}
                        style={{
                          position: "absolute",
                          left: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#8892a4",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* تصنيف الملفات */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { value: "all", label: "الكل" },
                      { value: "page", label: "الصفحات" },
                      { value: "api", label: "واجهات الـ API" },
                      { value: "core", label: "مكتبات ونماذج" },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setStructType(t.value)}
                        style={{
                          padding: "8px 14px",
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                          borderRadius: 8,
                          transition: "all 0.15s",
                          background:
                            structType === t.value
                              ? "rgba(14,165,233,0.15)"
                              : "rgba(255,255,255,0.03)",
                          color: structType === t.value ? "#38bdf8" : "#8892a4",
                          border: `1px solid ${structType === t.value ? "rgba(14,165,233,0.3)" : "rgba(255,255,255,0.06)"}`,
                          fontFamily: "'Tajawal', system-ui, sans-serif",
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* شبكة البطاقات */}
                {filteredFiles.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 0",
                      color: "#8892a4",
                      fontSize: 13.5,
                    }}
                  >
                    لا توجد نتائج تطابق بحثك الحالي
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {filteredFiles.map((file, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(file.path);
                            notify("تم نسخ المسار بنجاح");
                          }
                        }}
                        style={{
                          background: "#0d1424",
                          borderRadius: 12,
                          padding: "16px",
                          border: "1.5px solid rgba(255,255,255,0.04)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: 12,
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(96,165,250,0.25)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 6px 20px rgba(0,0,0,0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.04)";
                          e.currentTarget.style.transform = "none";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {/* محتوى البطاقة العلوي */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#fff",
                                background: file.badgeColor,
                                boxShadow: `0 2px 8px ${file.badgeColor}25`,
                              }}
                            >
                              {file.badge}
                            </span>
                            <span
                              style={{
                                fontSize: 18,
                                width: 30,
                                height: 30,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.04)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {file.icon}
                            </span>
                          </div>

                          <h3
                            style={{
                              fontSize: 14.5,
                              fontWeight: 700,
                              color: "#f0f2f8",
                              margin: 0,
                            }}
                          >
                            {file.name}
                          </h3>

                          <p
                            style={{
                              fontSize: 12,
                              color: "#8892a4",
                              lineHeight: 1.5,
                              margin: 0,
                              height: "48px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {file.desc}
                          </p>
                        </div>

                        {/* كود المسار السفلي */}
                        <div
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: 6,
                            padding: "8px 10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            marginTop: 4,
                          }}
                        >
                          <code
                            style={{
                              fontSize: 11,
                              fontFamily: "Consolas, monospace",
                              color:
                                file.type === "api" ? "#10b981" : "#60a5fa",
                              direction: "ltr",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              flex: 1,
                            }}
                          >
                            {file.path}
                          </code>
                          <span
                            style={{
                              fontSize: 11,
                              color: "#8892a4",
                              display: "flex",
                              alignItems: "center",
                            }}
                            title="نسخ المسار"
                          >
                            📋
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Modal: إضافة حساب
      ═══════════════════════════════════════════════════════════ */}
      <Modal
        open={modal === "add"}
        onClose={() => setModal(null)}
        title="إضافة حساب جديد"
      >
        <AccountForm
          onSubmit={addAccount}
          onCancel={() => setModal(null)}
          isSaving={isSaving}
        />
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
          Modal: تعديل حساب
      ═══════════════════════════════════════════════════════════ */}
      <Modal
        open={modal === "edit"}
        onClose={() => setModal(null)}
        title="تعديل الحساب"
      >
        {selected && (
          <AccountForm
            initial={{ ...selected, password: "" }}
            onSubmit={editAccount}
            onCancel={() => setModal(null)}
            isSaving={isSaving}
          />
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
          Modal: حذف حساب
      ═══════════════════════════════════════════════════════════ */}
      <Modal
        open={modal === "delete"}
        onClose={() => setModal(null)}
        title="تأكيد الحذف"
      >
        {selected && (
          <div>
            <div
              style={{
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 18,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "#f87171",
                  lineHeight: 1.6,
                }}
              >
                هل أنت متأكد من حذف حساب{" "}
                <strong style={{ color: "#f0f2f8" }}>
                  «{selected.username}»
                </strong>
                ؟
                <br />
                <span style={{ fontSize: 12.5, color: "#8892a4" }}>
                  هذا الإجراء لا يمكن التراجع عنه.
                </span>
              </p>
            </div>

            <p style={{ fontSize: 13, color: "#8892a4", marginBottom: 10 }}>
              اكتب{" "}
              <strong style={{ color: "#f0f2f8" }}>{selected.username}</strong>{" "}
              للتأكيد:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={selected.username}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                background: "#0d1424",
                border: "1.5px solid rgba(248,113,113,0.3)",
                borderRadius: 8,
                color: "#f0f2f8",
                outline: "none",
                direction: "rtl",
                fontFamily: "'Tajawal', system-ui, sans-serif",
                marginBottom: 18,
                boxSizing: "border-box",
              }}
            />

            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <Btn variant="ghost" onClick={() => setModal(null)}>
                إلغاء
              </Btn>
              <Btn
                variant="danger"
                disabled={deleteConfirm !== selected.username || isSaving}
                onClick={deleteAccount}
              >
                {isSaving ? <Spinner /> : <Icon.Trash />}
                {isSaving ? "جاري الحذف..." : "تأكيد الحذف"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
          Modal: تجديد المحاولات
      ═══════════════════════════════════════════════════════════ */}
      <Modal
        open={modal === "attempts"}
        onClose={() => setModal(null)}
        title="تجديد المحاولات"
      >
        {selected && (
          <div>
            <div
              style={{
                background: "rgba(96,165,250,0.07)",
                border: "1px solid rgba(96,165,250,0.2)",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#f0f2f8",
                  }}
                >
                  {selected.username}
                </p>
                <p
                  style={{ margin: "2px 0 0", fontSize: 12, color: "#8892a4" }}
                >
                  <RoleBadge role={selected.role} />
                </p>
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: 11, color: "#8892a4" }}>
                  المحاولات الحالية
                </p>
                <AttemptsBadge attempts={selected.attempts || 0} />
              </div>
            </div>

            <Field label="عدد المحاولات الجديدة" icon={Icon.Hash}>
              <Input
                type="number"
                min="0"
                step="1"
                value={newAttempts}
                onChange={(e) => setNewAttempts(e.target.value)}
                placeholder="مثال: 10"
                suffix="محاولة"
              />
            </Field>

            {/* اختصارات سريعة */}
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              {[5, 10, 20, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setNewAttempts(String(n))}
                  style={{
                    padding: "5px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    background:
                      newAttempts == n
                        ? "rgba(14,165,233,0.25)"
                        : "rgba(255,255,255,0.06)",
                    border: `1px solid ${newAttempts == n ? "rgba(14,165,233,0.5)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 6,
                    color: newAttempts == n ? "#60a5fa" : "#8892a4",
                    cursor: "pointer",
                    fontFamily: "'Tajawal', system-ui, sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  +{n}
                </button>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                marginTop: 20,
              }}
            >
              <Btn variant="ghost" onClick={() => setModal(null)}>
                إلغاء
              </Btn>
              <Btn
                variant="success"
                onClick={renewAttempts}
                disabled={isSaving || !newAttempts}
              >
                {isSaving ? <Spinner /> : <Icon.Check />}
                {isSaving ? "جاري المنح..." : "منح المحاولات"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast */}
      <Toast msg={toast} onDone={() => setToast({ text: "", type: "" })} />
    </div>
  );
}

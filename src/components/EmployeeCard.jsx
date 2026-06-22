"use client";

import { useState } from "react";
import { WhatsAppIcon, PhoneIcon } from "@/components/Icons";

// ─── Phone masking ────────────────────────────────────────────────────────────
function maskPhone(phone) {
  if (!phone || phone.length < 4) return phone;
  const last4 = phone.slice(-4);
  return `****-***-${last4}`;
}

// ─── WhatsApp URL builder ─────────────────────────────────────────────────────
function buildWhatsAppUrl(phone) {
  // Remove leading 0 and prepend Egypt country code 20
  const intl = "20" + phone.replace(/^0/, "");
  const greeting = encodeURIComponent(
    "السلام عليكم"
  );
  return `https://wa.me/${intl}?text=${greeting}`;
}

// ─── Copy to clipboard helper ─────────────────────────────────────────────────
function CopyIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// ─── Employee Card ────────────────────────────────────────────────────────────
export default function EmployeeCard({ employee }) {
  const { name, phone, role } = employee;
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text in a temporary input
      const el = document.createElement("input");
      el.value = phone;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      dir="rtl"
      className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
    >
      {/* Header with status */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            متاح
          </span>
          <span className="text-[11.5px] font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
            {role}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-[17px] font-bold text-slate-100 mb-1">
          {name}
        </h3>

        {/* Masked phone */}
        <p className="text-[13px] text-slate-500 ltr text-right" dir="ltr">
          {maskPhone(phone)}
        </p>
      </div>

      {/* Action buttons */}
      <div className="px-5 pb-4 flex gap-2.5">
        {/* Call button */}
        <a
          href={`tel:${phone}`}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 no-underline transition-all hover:bg-sky-500/20 active:scale-[0.97]"
        >
          <PhoneIcon size={16} />
          اتصال
        </a>
        {/* WhatsApp button */}
        <a
          href={buildWhatsAppUrl(phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 no-underline transition-all hover:bg-emerald-500/20 active:scale-[0.97]"
        >
          <WhatsAppIcon size={16} />
          واتساب
        </a>

        {/* Copy phone (desktop helper) */}
        <button
          onClick={handleCopyPhone}
          title="نسخ رقم الهاتف"
          className="flex items-center justify-center w-[46px] h-[46px] rounded-xl bg-slate-800 text-slate-400 border border-slate-700 cursor-pointer transition-all hover:bg-slate-700 active:scale-[0.97] shrink-0"
        >
          {copied ? (
            <span className="text-emerald-500 text-sm font-bold">✓</span>
          ) : (
            <CopyIcon size={16} />
          )}
        </button>
      </div>
    </div>
  );
}

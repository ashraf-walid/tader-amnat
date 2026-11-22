'use client';

import { useState } from 'react';
import { SummaryIcon } from '@/components/Icons';

const CARGO_LABELS = {
  FULL: "عادية",
  REEFER: "ثلاجة ❄️",
  DANGEROUS: "خطرة ⚠️",
  NON_STANDARD: "غير منتظمة",
};

const NON_STD_LABELS = {
  OOG: "سعر مضاعف ×٢",
  LASHING: "سعر مضاعف ×٤",
};

function CollapsibleBreakdown({ title, items, formatNumber }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <div className="border-t border-white/[0.07] bg-[#0b1120]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-3 px-5 cursor-pointer hover:bg-white/[0.02] transition-colors select-none text-right"
      >
        <div className="flex items-center gap-2 text-[10px] font-extrabold text-[#8892a4] tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f0b429]" />
          <span>{title}</span>
          <span className="text-[10px] text-slate-500 font-normal">
            ({items.length} {items.length === 1 ? "شريحة" : "شرائح"})
          </span>
        </div>
        <span
          className={`text-sm text-[#8892a4] transition-transform duration-300 ${
            isOpen ? "rotate-180 text-[#f0b429]" : ""
          }`}
        >
          ⌄
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen
            ? "max-h-[800px] opacity-100 px-5 pb-4 pt-1"
            : "max-h-0 opacity-0 px-5 py-0 pointer-events-none"
        }`}
      >
        <div className="space-y-2">
          {items.map((item, i) => {
            const isGrace =
              item.subtotal === 0 ||
              item.rate === 0 ||
              item.tierName?.includes("سماح");

            return (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
              >
                {/* اسم الشريحة والشارة */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#f0f2f8]">
                    {item.tierName}
                  </span>
                  {isGrace && (
                    <span className="text-[7px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      بدون رسوم تخزين
                    </span>
                  )}
                </div>

                {/* تفاصيل الأيام والمبلغ */}
                <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px]">
                  {/* شارة الأيام المنظمة */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.05] text-[#8892a4]">
                    <span>
                      من اليوم <strong className="text-white font-mono">{item.fromDay}</strong> إلى <strong className="text-white font-mono">{item.toDay}</strong>
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="text-[#f0b429] font-bold font-mono">
                      {item.days} {item.days === 1 ? "يوم" : item.days === 2 ? "يومان" : "أيام"}
                    </span>
                  </div>

                  {/* الحسبة والمبلغ */}
                  <div className="min-w-[75px] text-left">
                    {isGrace ? (
                      <span className="font-mono font-bold text-emerald-400 text-[11px]">$0.00</span>
                    ) : (
                      <div className="flex items-baseline justify-end gap-1.5 font-mono">
                        {item.rate > 0 && (
                          <span className="text-[10px] text-[#4a5568]">
                            ({item.days}×${formatNumber(item.rate)})
                          </span>
                        )}
                        <span className="font-bold text-[#f0b429] text-[11px]">
                          ${formatNumber(item.subtotal)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ResultSection({
  result,
  twentyCargoType, fortyCargoType,
  nonStdType20, nonStdType40,
  formatNumber, resetForm, billingType,
  onOpenServices
}) {
  // Build a human-readable cargo label for each size
  function buildCargoLabel(cargoType, nonStdType, sizeLabel, count) {
    if (count === 0) return null;
    if (cargoType === "NON_STANDARD") {
      return `${sizeLabel}: ${CARGO_LABELS[cargoType]} (${NON_STD_LABELS[nonStdType] || nonStdType})`;
    }
    return `${sizeLabel}: ${CARGO_LABELS[cargoType] || cargoType}`;
  }

  const label20 = buildCargoLabel(twentyCargoType, nonStdType20, "٢٠ قدم", result.summary.groups.find(g => g.sizeLabel === "٢٠ قدم")?.count ?? 0);
  const label40 = buildCargoLabel(fortyCargoType, nonStdType40, "٤٠ قدم", result.summary.groups.find(g => g.sizeLabel === "٤٠ قدم")?.count ?? 0);

  // Check if cargo types differ (mixed shipment)
  const isMixed = label20 && label40 && twentyCargoType !== fortyCargoType;

  // For storage fee label (non-standard note)
  function storageFeeLabel() {
    const labels = [];
    if (twentyCargoType === "NON_STANDARD") labels.push(`٢٠ق ${NON_STD_LABELS[nonStdType20] || ''}`);
    if (fortyCargoType === "NON_STANDARD") labels.push(`٤٠ق ${NON_STD_LABELS[nonStdType40] || ''}`);
    if (labels.length > 0) return `رسوم التخزين (${labels.join(' / ')})`;
    return "رسوم التخزين";
  }

  const hasAnyServices =
    (result.usd.additionalServices > 0) ||
    (result.usd.cargoServiceFee > 0) ||
    (result.usd.cargoStorageFee > 0) ||
    (result.usd.dangerYardFee > 0);

  return (
    <div className="mt-6 animate-[fadeup_0.35s_ease]" id="result-section">
      <div className="bg-[#111827] border border-white/[0.12] rounded-[20px] overflow-hidden">
        <div className="py-4 px-5 bg-[#1a2035] border-b border-white/[0.07] flex items-center gap-2.5 text-[13px] font-bold text-[#8892a4] tracking-widest uppercase">
          <SummaryIcon />
          ملخص الفاتورة
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-0 border-b border-white/[0.07]">
          {[
            ["الأيام", result.summary.days, "يوم"],
            ["الحاويات", result.summary.groups.reduce((acc, g) => acc + g.count, 0), "حاوية"],
            ["سعر الصرف", formatNumber(result.summary.exchangeRate), "ج.م/$"],
          ].map(([label, value, unit], idx) => (
            <div key={label} className={`py-4 px-3 text-center ${idx < 2 ? 'border-l border-white/[0.07]' : ''}`}>
              <div className="text-[10px] text-[#4a5568] mb-1 font-semibold tracking-wider uppercase">{label}</div>
              <div className="text-[22px] font-extrabold text-[#f0f2f8] leading-none">{value}</div>
              <div className="text-[10px] text-[#4a5568] mt-1">{unit}</div>
            </div>
          ))}
        </div>

        {/* نوع البضاعة — يظهر فقط عند الحاجة */}
        {(label20 || label40) && (
          <div className="px-5 py-3 border-b border-white/[0.07] flex flex-col gap-1">
            {isMixed && (
              <div className="text-[10px] font-bold tracking-widest uppercase text-amber-400/70 mb-1 flex items-center gap-1.5">
                <span>⚠</span> بوليصة مختلطة الأنواع
              </div>
            )}
            {label20 && (
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#4a5568]">نوع البضاعة</span>
                <span className="text-[#f0f2f8] font-semibold">{label20}</span>
              </div>
            )}
            {label40 && (
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#4a5568]">نوع البضاعة</span>
                <span className="text-[#f0f2f8] font-semibold">{label40}</span>
              </div>
            )}
          </div>
        )}

        {/* Rows */}
        {[
          [storageFeeLabel(), `${formatNumber(result.usd.storageFee + (result.usd.surchargeFee || 0))}`, false],
          ["رسوم الخدمات الثابتة", `${formatNumber(result.usd.fixedFees)}`, false],
          ...(result.usd.additionalServices > 0
            ? [["الخدمات الإضافية", `${formatNumber(result.usd.additionalServices)}`, false]]
            : []),
          ...(result.usd.cargoServiceFee > 0
            ? [["تفريغ مشمول", `${formatNumber(result.usd.cargoServiceFee)}`, false]]
            : []),
          ...(result.usd.cargoStorageFee > 0
            ? [["أرضيات المشمول", `${formatNumber(result.usd.cargoStorageFee)}`, false]]
            : []),
          ...(result.usd.dangerYardFee > 0
            ? [["تخزين ساحة الطوارئ", `${formatNumber(result.usd.dangerYardFee)}`, false]]
            : []),
          ...(!hasAnyServices
            ? [["__NO_SERVICES__", "", false]]
            : []),
          ["الإجمالي بالدولار", `${formatNumber(result.usd.subtotal)}`, true],
          ["الإجمالي بالجنيه", `${formatNumber(result.egp.subtotal, 0)} ج.م`, false],
          ["ضريبة القيمة المضافة 14%", `${formatNumber(result.egp.vatAmount, 0)} ج.م`, false],
          ["طابع الشهيد", `${result.egp.martyrStamp} ج.م`, false],
        ].map(([label, value, isSubtotal]) => {
          if (label === "__NO_SERVICES__") {
            return (
              <div key="no-services" className="flex justify-between items-center py-2.5 px-5 border-b border-white/[0.07] bg-amber-500/5 text-xs">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 shrink-0" />
                  <span>الخدمات:</span>
                  <span className="text-slate-400 font-medium"> تأكد أن كشف الحركة لا يحتوى على اي خدمه اضافيه</span>
                </span>
                {onOpenServices && (
                  <button
                    type="button"
                    onClick={onOpenServices}
                    className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer flex items-center gap-1 hover:underline"
                  >
                    <span>+ إضافة</span>
                  </button>
                )}
              </div>
            );
          }
          return (
            <div key={label} className={`flex justify-between items-center py-3 px-5 border-b border-white/[0.07] text-sm last:border-b-0 ${isSubtotal ? 'bg-[#1a2035]' : ''}`}>
              <span className="text-[#8892a4]">{label}</span>
              <span className={`font-bold ${isSubtotal ? 'text-[#f0b429]' : 'text-[#f0f2f8]'}`}>{value}</span>
            </div>
          );
        })}

        <div className="flex justify-between items-center py-5 px-5 bg-linear-to-l from-[rgba(240,180,41,0.15)] to-[rgba(240,180,41,0.05)] border-t border-[rgba(240,180,41,0.3)]">
          <span className="text-[15px] font-bold text-[#f0b429]">الإجمالي النهائي</span>
          <span className="text-[28px] font-extrabold text-[#f0b429] tracking-tight">{formatNumber(result.egp.total, 0)} ج.م</span>
        </div>

        <CollapsibleBreakdown
          title="تفصيل شرائح التخزين"
          items={result.details.storageBreakdown}
          formatNumber={formatNumber}
        />
        <CollapsibleBreakdown
          title="تفصيل شرائح أرضيات المشمول"
          items={result.details.cargoBreakdown}
          formatNumber={formatNumber}
        />
        <CollapsibleBreakdown
          title="تفصيل شرائح ساحة الطوارئ"
          items={result.details.dangerYardBreakdown}
          formatNumber={formatNumber}
        />
      </div>

      <button
        className="w-full py-4 text-base font-extrabold rounded-2xl border border-white/[0.12] bg-transparent text-[#8892a4] cursor-pointer mt-5 shadow-none transition-all hover:bg-[#111827] hover:text-[#f0f2f8]"
        onClick={resetForm}>
        {billingType === "RENEWAL" && result.usd.storageFee === 0 ? "بدء حساب بوليصة جديدة" : "إبدأ حساب بوليصه اخرى"}
      </button>
    </div>
  );
}

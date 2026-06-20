'use client';

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

export default function ResultSection({
  result,
  twentyCargoType, fortyCargoType,
  nonStdType20, nonStdType40,
  formatNumber, resetForm, billingType
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
          ["الإجمالي بالدولار", `${formatNumber(result.usd.subtotal)}`, true],
          ["الإجمالي بالجنيه", `${formatNumber(result.egp.subtotal, 0)} ج.م`, false],
          ["ضريبة القيمة المضافة 14%", `${formatNumber(result.egp.vatAmount, 0)} ج.م`, false],
          ["طابع الشهيد", `${result.egp.martyrStamp} ج.م`, false],
        ].map(([label, value, isSubtotal]) => (
          <div key={label} className={`flex justify-between items-center py-3 px-5 border-b border-white/[0.07] text-sm last:border-b-0 ${isSubtotal ? 'bg-[#1a2035]' : ''}`}>
            <span className="text-[#8892a4]">{label}</span>
            <span className={`font-bold ${isSubtotal ? 'text-[#f0b429]' : 'text-[#f0f2f8]'}`}>{value}</span>
          </div>
        ))}

        <div className="flex justify-between items-center py-5 px-5 bg-linear-to-l from-[rgba(240,180,41,0.15)] to-[rgba(240,180,41,0.05)] border-t border-[rgba(240,180,41,0.3)]">
          <span className="text-[15px] font-bold text-[#f0b429]">الإجمالي النهائي</span>
          <span className="text-[28px] font-extrabold text-[#f0b429] tracking-tight">{formatNumber(result.egp.total, 0)} ج.م</span>
        </div>

        {result.details.storageBreakdown.length > 0 && (
          <div className="py-3.5 px-5 bg-[#0b1120] border-t border-white/[0.07]">
            <div className="text-[10px] font-bold text-[#4a5568] tracking-widest uppercase mb-2">تفصيل شرائح التخزين</div>
            {result.details.storageBreakdown.map((item, i) => (
              <div key={i} className="flex justify-between text-xs text-[#4a5568] py-1 border-b border-dashed border-white/[0.07] last:border-b-0">
                <span>{item.tierName} — {item.days} يوم (من {item.fromDay} إلى {item.toDay})</span>
                <span className="text-[#8892a4] font-bold">${formatNumber(item.subtotal)}</span>
              </div>
            ))}
          </div>
        )}

        {result.details.cargoBreakdown?.length > 0 && (
          <div className="py-3.5 px-5 bg-[#0b1120] border-t border-white/[0.07]">
            <div className="text-[10px] font-bold text-[#4a5568] tracking-widest uppercase mb-2">تفصيل شرائح أرضيات المشمول</div>
            {result.details.cargoBreakdown.map((item, i) => (
              <div key={i} className="flex justify-between text-xs text-[#4a5568] py-1 border-b border-dashed border-white/[0.07] last:border-b-0">
                <span>{item.tierName} — {item.days} يوم (من {item.fromDay} إلى {item.toDay})</span>
                <span className="text-[#8892a4] font-bold">${formatNumber(item.subtotal)}</span>
              </div>
            ))}
          </div>
        )}

        {result.details.dangerYardBreakdown?.length > 0 && (
          <div className="py-3.5 px-5 bg-[#0b1120] border-t border-white/[0.07]">
            <div className="text-[10px] font-bold text-[#4a5568] tracking-widest uppercase mb-2">تفصيل شرائح ساحة الطوارئ</div>
            {result.details.dangerYardBreakdown.map((item, i) => (
              <div key={i} className="flex justify-between text-xs text-[#4a5568] py-1 border-b border-dashed border-white/[0.07] last:border-b-0">
                <span>{item.tierName} — {item.days} يوم (من {item.fromDay} إلى {item.toDay})</span>
                <span className="text-[#8892a4] font-bold">${formatNumber(item.subtotal)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="w-full py-4 text-base font-extrabold rounded-2xl border border-white/[0.12] bg-transparent text-[#8892a4] cursor-pointer mt-5 shadow-none transition-all hover:bg-[#111827] hover:text-[#f0f2f8]"
        onClick={resetForm}>
        {billingType === "RENEWAL" && result.usd.storageFee === 0 ? "بدء حساب بوليصة جديدة" : "إبدأ حساب بوليصه اخرى"}
      </button>
    </div>
  );
}

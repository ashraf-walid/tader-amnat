'use client';

import ArabicDatePicker from '@/components/ArabicDatePicker';

export default function BillingTypeSelector({
  billingType,
  setBillingType,
  firstInvoiceDate,
  setFirstInvoiceDate,
  arrDate,
  relDate,
  prevDays
}) {
  return (
    <div className="bg-[#111827] border border-white/[0.12] rounded-[20px] p-6 mb-4">
      {/* Release type */}
      <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-2">
        <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
        نوع الصرف
      </div>
      <div className="flex gap-0 bg-[#0b1120] rounded-xl overflow-hidden border border-white/[0.07] mb-5">
        {[["INITIAL", "صرف أول مرة"], ["RENEWAL", "تجديد"]].map(([value, label]) => (
          <button
            key={value}
            className={`flex-1 py-3 px-4 text-sm font-semibold border-none cursor-pointer transition-all ${billingType === value
              ? 'bg-[#f0b429] text-[#0b1120] font-extrabold'
              : 'bg-transparent text-[#8892a4] hover:bg-[#1a2035] hover:text-[#f0f2f8]'
            }`}
            onClick={() => setBillingType(value)}>
            {label}
          </button>
        ))}
      </div>

      {/* Previous days */}
      {billingType === "RENEWAL" && (
        <>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-3">
            <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
            تاريخ سداد الفاتورة الأولى
          </div>
          <div className="flex flex-col gap-2 mb-4">
            <ArabicDatePicker
              id="first-invoice-date"
              label="تاريخ إنشاء / سداد فاتورة الصرف أول مرة"
              selected={firstInvoiceDate}
              onChange={setFirstInvoiceDate}
              minDate={arrDate || undefined}
              maxDate={relDate || undefined}
              placeholderText="يوم / شهر / سنة"
            />
            {prevDays > 0 && (
              <div className="text-xs font-semibold text-[#f0b429] bg-[rgba(240,180,41,0.1)] border border-[rgba(240,180,41,0.2)] rounded-xl px-3 py-2">
                الأيام المسددة سابقاً: {prevDays} يوم
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

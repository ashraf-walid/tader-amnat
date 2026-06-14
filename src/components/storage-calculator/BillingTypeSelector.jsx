'use client';

export default function BillingTypeSelector({ billingType, setBillingType, prevDays, setPrevDays, days }) {
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
            الأيام المسددة سابقاً (في الفاتورة الأولى)
          </div>
          <div className="flex flex-col gap-2 mb-4">
            <input
              type="number"
              className="w-full py-3 px-3.5 rounded-xl border-[1.5px] border-white/[0.12] bg-[#1a2035] text-[#f0f2f8] text-[15px] font-medium text-right outline-none transition-all focus:border-[#f0b429] focus:shadow-[0_0_0_3px_rgba(240,180,41,0.12)]"
              style={{ direction: 'rtl' }}
              value={prevDays}
              min={0}
              max={days || undefined}
              onChange={e => {
                const val = Number(e.target.value);
                const maxDays = days || 0;
                setPrevDays(val > maxDays ? maxDays : (val < 0 ? 0 : val));
              }}
              placeholder="0"
            />
          </div>
        </>
      )}
    </div>
  );
}

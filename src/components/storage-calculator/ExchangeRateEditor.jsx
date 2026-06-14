'use client';

import { EditIcon } from '@/components/Icons';

export default function ExchangeRateEditor({
  adminExchangeRate,
  isRateOverridden,
  setIsRateOverridden,
  isEditingRate,
  setIsEditingRate,
  customRate,
  setCustomRate,
  exchangeRate,
  formatNumber
}) {
  return (
    <div className="flex items-center justify-between bg-[#111827] border border-white/[0.12] rounded-2xl px-[18px] py-3.5 mb-5 gap-3 flex-wrap">
      <div className="flex items-center gap-2.5">
        <span
          className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px] animate-[pulse-dot_2s_infinite]"
          style={{
            background: isRateOverridden ? '#f0b429' : '#34d399',
            boxShadow: `0 0 8px ${isRateOverridden ? '#f0b429' : '#34d399'}`
          }}
        />
        <div>
          <div className="text-xs text-[#8892a4]">{isRateOverridden ? "سعر صرف مخصص" : "سعر الصرف اليوم"}</div>
          <div className="text-xl font-extrabold text-[#f0f2f8]">
            {formatNumber(isRateOverridden ? exchangeRate : adminExchangeRate)}
            <span className="text-[13px] font-medium text-[#8892a4]"> ج.م / $</span>
          </div>
          <div className="text-[11px] text-[#4a5568] mt-0.5">{isRateOverridden ? "تم التعديل بواسطة المستخدم" : "مُسجَّل بواسطة الإدارة"}</div>
        </div>
      </div>

      {!isEditingRate ? (
        <div className="flex gap-2">
          {isRateOverridden && (
            <button
              className="flex items-center gap-1.5 text-xs text-[#f87171] bg-[#1a2035] border border-red-500/20 rounded-lg px-3 py-1.5 cursor-pointer transition-all hover:text-[#f87171] hover:border-red-500/30 whitespace-nowrap"
              onClick={() => { setIsRateOverridden(false); setCustomRate(String(adminExchangeRate)); }}>
              إلغاء المخصص
            </button>
          )}
          <button
            className="flex items-center gap-1.5 text-xs text-[#8892a4] bg-[#1a2035] border border-white/[0.12] rounded-lg px-3 py-1.5 cursor-pointer transition-all hover:text-[#f0b429] hover:border-[rgba(240,180,41,0.3)] whitespace-nowrap"
            onClick={() => setIsEditingRate(true)}>
            <EditIcon />
            تعديل السعر
          </button>
        </div>
      ) : (
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 bg-[#1a2035] border-[1.5px] border-[#f0b429] rounded-[10px] px-3 py-2 mt-2.5 shadow-[0_0_0_3px_rgba(240,180,41,0.12)] w-full">
            <span className="text-xs text-[#8892a4] whitespace-nowrap">سعر مخصص</span>
            <input
              type="number"
              min={1}
              step={0.01}
              value={customRate}
              onChange={e => setCustomRate(e.target.value)}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setIsRateOverridden(true);
                  setIsEditingRate(false);
                }
              }}
              className="flex-1 bg-transparent border-none outline-none text-[15px] font-bold text-[#f0b429] text-right min-w-0"
              style={{ direction: 'rtl' }}
            />
            <span className="text-[13px] font-semibold text-[#f0b429]">ج.م</span>

            <button
              className="bg-[#34d399] border-none text-[#0b1120] px-2.5 py-1 rounded cursor-pointer text-[13px] font-bold"
              onClick={() => { setIsRateOverridden(true); setIsEditingRate(false); }}
              title="تأكيد التعديل">
              ✓ تأكيد
            </button>

            <button
              className="bg-transparent border-none cursor-pointer text-[#4a5568] text-lg leading-none px-1 py-0.5 transition-colors hover:text-[#f87171]"
              onClick={() => { setIsEditingRate(false); if (!isRateOverridden) setCustomRate(String(adminExchangeRate)); }}
              title="إلغاء التعديل">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';

/**
 * CargoTypeSelector (Unified — with per-size summary badges)
 * Props:
 *   twentyCount / fortyCount           — number of containers per size
 *   twentyCargoType / fortyCargoType   — current selections
 *   setTwentyCargoType / setFortyCargoType — setters
 */

const CARGO_OPTIONS = [
  { value: 'FULL',         label: 'عادية',         short: 'عادية' },
  { value: 'REEFER',       label: 'ثلاجة ❄️',      short: 'ثلاجة' },
  { value: 'DANGEROUS',    label: 'خطرة ⚠️',       short: 'خطرة'  },
  { value: 'NON_STANDARD', label: 'غير منتظمة',    short: 'غير منتظمة' },
];

function getShortLabel(value) {
  return CARGO_OPTIONS.find(o => o.value === value)?.short ?? value;
}

/* Small summary badge — shown inside the inactive tab */
function TypeBadge({ value }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#f0b429]/15 text-[#f0b429] border border-[#f0b429]/20 leading-none shadow-sm mx-1">
      {getShortLabel(value)}
    </span>
  );
}

function CargoButtons({ cargoType, setCargoType }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {CARGO_OPTIONS.map(({ value, label }) => {
        const isActive = cargoType === value;
        return (
          <button
            key={value}
            onClick={() => setCargoType(value)}
            className={`relative py-3 px-2 rounded-xl border-[1.5px] text-[13px] font-bold cursor-pointer transition-all duration-300 ease-out whitespace-nowrap flex items-center justify-center ${
              isActive
                ? 'border-[#f0b429] bg-gradient-to-br from-[#f0b429]/15 to-[#f0b429]/5 text-[#f0b429] shadow-[0_4px_16px_rgba(240,180,41,0.15)] scale-[1.02]'
                : 'border-transparent bg-white/[0.03] text-[#8892a4] hover:text-[#f0f2f8] hover:bg-white/[0.06] hover:scale-[1.02] hover:border-white/10'
            }`}
          >
            {label}
            {isActive && (
              <span className="absolute inset-0 rounded-xl ring-2 ring-[#f0b429]/20 pointer-events-none" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function CargoTypeSelector({
  twentyCount,
  fortyCount,
  twentyCargoType,
  setTwentyCargoType,
  fortyCargoType,
  setFortyCargoType,
}) {
  const hasTwenty = twentyCount > 0;
  const hasForty  = fortyCount  > 0;
  const bothActive = hasTwenty && hasForty;

  const [activeTab, setActiveTab] = useState(() => hasTwenty ? '20' : '40');

  // Derive the effectively active tab. If user zeroed out one size, auto-switch to the other.
  const currentTab = (!hasTwenty && activeTab === '20') ? '40' : (!hasForty && activeTab === '40') ? '20' : activeTab;

  if (!hasTwenty && !hasForty) return null;

  const currentCargoType    = currentTab === '20' ? twentyCargoType    : fortyCargoType;
  const setCurrentCargoType = currentTab === '20' ? setTwentyCargoType : setFortyCargoType;

  return (
    <div className="bg-gradient-to-b from-[#111827] to-[#0d1424] border border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-[24px] p-6 mb-5 transition-all duration-300 hover:border-white/[0.12]">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 text-[11px] font-extrabold tracking-widest uppercase text-[#4a5568] mb-5">
        <span className="w-1 h-4 bg-gradient-to-b from-[#f0b429] to-[#d69b1e] rounded-full shadow-[0_0_8px_rgba(240,180,41,0.5)]" />
        نوع البضاعة
      </div>

      {/* ── Tab bar (only when both sizes active) ── */}
      {bothActive && (
        <div className="flex mb-6 bg-black/40 rounded-xl p-1.5 w-full sm:w-max border border-white/[0.04]">
          {/* 20ft tab */}
          <button
            onClick={() => setActiveTab('20')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-300 ease-out ${
              currentTab === '20'
                ? 'bg-[#f0b429] text-[#020617] shadow-md scale-100'
                : 'text-[#8892a4] hover:text-white hover:bg-white/5 opacity-80 hover:opacity-100'
            }`}
          >
            <span>٢٠ قدم</span>
            {currentTab !== '20' && <TypeBadge value={twentyCargoType} />}
          </button>

          {/* 40ft tab */}
          <button
            onClick={() => setActiveTab('40')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-300 ease-out ${
              currentTab === '40'
                ? 'bg-[#f0b429] text-[#020617] shadow-md scale-100'
                : 'text-[#8892a4] hover:text-white hover:bg-white/5 opacity-80 hover:opacity-100'
            }`}
          >
            <span>٤٠ قدم</span>
            {currentTab !== '40' && <TypeBadge value={fortyCargoType} />}
          </button>
        </div>
      )}

      {/* ── Single-size label ── */}
      {!bothActive && (
        <div className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[#8892a4] text-[13px] font-bold mb-5 shadow-sm">
          {hasTwenty ? '٢٠ قدم' : '٤٠ قدم'}
        </div>
      )}

      {/* ── Cargo type buttons ── */}
      <CargoButtons
        cargoType={currentCargoType}
        setCargoType={setCurrentCargoType}
      />

      {/* ── DANGEROUS warning ── */}
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          currentCargoType === 'DANGEROUS' ? 'max-h-[100px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0 pt-0'
        }`}
      >
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <span className="text-amber-400 text-lg leading-none mt-0.5">⚠</span>
          <p className="text-[12px] font-semibold text-amber-400/90 leading-relaxed">
            الأسعار والحسابات مبنية على درجات الخطورة 3، 4، 5، 8، 9. <br className="hidden md:block"/>
            يرجى التأكد من درجة تصنيف البضاعة ومطابقتها.
          </p>
        </div>
      </div>

      {/* ── Summary strip (shown only when both active) ── */}
      {bothActive && (
        <div className="mt-6 pt-5 border-t border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0b429]/10 text-[#f0b429]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
                <span className="text-[13px] font-bold text-[#8892a4]">ملخص اختيارات البضاعة:</span>
            </div>
            
            <div className="flex items-center gap-3 text-[13px]">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${currentTab === '20' ? 'bg-[#f0b429]/10 border border-[#f0b429]/25 shadow-sm' : ''}`}>
                    <span className="text-[#64748b] font-medium">٢٠ قدم:</span>
                    <span className={`font-bold ${currentTab === '20' ? 'text-[#f0b429]' : 'text-[#e2e8f0]'}`}>
                        {getShortLabel(twentyCargoType)}
                    </span>
                </div>
                <div className="w-px h-5 bg-white/10"></div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${currentTab === '40' ? 'bg-[#f0b429]/10 border border-[#f0b429]/25 shadow-sm' : ''}`}>
                    <span className="text-[#64748b] font-medium">٤٠ قدم:</span>
                    <span className={`font-bold ${currentTab === '40' ? 'text-[#f0b429]' : 'text-[#e2e8f0]'}`}>
                        {getShortLabel(fortyCargoType)}
                    </span>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

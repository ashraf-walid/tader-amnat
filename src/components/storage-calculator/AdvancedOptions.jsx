'use client';

import { OptionsIcon, CheckIcon } from '@/components/Icons';
import ArabicDatePicker from '@/components/ArabicDatePicker';
import { STORAGE_CONFIG, SERVICES_LIST } from '@/lib/storageConstants';

export default function AdvancedOptions({
  advOpen, setAdvOpen,
  hasAdvanced,
  // Per-size cargo type
  twentyCargoType, fortyCargoType,
  // Per-size non-standard type
  nonStdType20, setNonStdType20,
  nonStdType40, setNonStdType40,
  // Per-size danger yard
  hasDangerYard20, setHasDangerYard20,
  hasDangerYard40, setHasDangerYard40,
  // Cargo services
  hasCargoStripping, setHasCargoStripping,
  hasCargoStorage, setHasCargoStorage,
  cargoExitDate, setCargoExitDate, arrDate, relDate,
  // Release type
  isExternalStorage, setIsExternalStorage,
  isLCLStorage, setIsLCLStorage,
  isHolidayRelease, setIsHolidayRelease,
  // Yard services
  services, toggleService,
  serviceQuantities, setServiceQuantities,
  twentyCount, fortyCount,
  nsMultiplier20, nsMultiplier40
}) {
  const totalConts = twentyCount + fortyCount;
  const nsMultiplier = nsMultiplier20; // baseline for shared services

  const showNonStd20 = twentyCount > 0 && twentyCargoType === "NON_STANDARD";
  const showNonStd40 = fortyCount > 0 && fortyCargoType === "NON_STANDARD";
  const showNonStdSection = showNonStd20 || showNonStd40;

  const canDangerYard20 = twentyCount > 0 && twentyCargoType !== "NON_STANDARD";
  const canDangerYard40 = fortyCount > 0 && fortyCargoType !== "NON_STANDARD";
  const showDangerYardSection = canDangerYard20 || canDangerYard40;

  // Helper: qty counter widget
  function QtyCounter({ storeKey, defaultQty }) {
    const qty = serviceQuantities[storeKey] !== undefined ? serviceQuantities[storeKey] : defaultQty;
    return (
      <div className="flex items-center gap-0 w-[90px] rounded-xl border-[1.5px] border-[#f0b429] overflow-hidden">
        <button
          className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
          onClick={() => setServiceQuantities(p => ({ ...p, [storeKey]: Math.max(1, Number(qty) - 1) }))}
        >−</button>
        <div className="flex-1 text-center text-sm font-extrabold text-[#f0f2f8] select-none">{qty}</div>
        <button
          className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
          onClick={() => setServiceQuantities(p => ({ ...p, [storeKey]: Number(qty) + 1 }))}
        >+</button>
      </div>
    );
  }

  // Helper: checkbox toggle label
  function CheckLabel({ checked, onChange, disabled, children }) {
    return (
      <label
        className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${checked ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="hidden" />
        <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${checked ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
          {checked && <CheckIcon />}
        </span>
        {children}
      </label>
    );
  }

  return (
    <>
      <button
        className={`flex items-center justify-between w-full bg-[#111827] border border-white/[0.07] rounded-2xl px-[18px] py-3.5 cursor-pointer text-sm font-semibold text-[#8892a4] transition-all mb-0 hover:border-white/[0.12] hover:text-[#f0f2f8] ${advOpen ? 'rounded-b-none border-b-transparent text-[#f0f2f8]' : ''
          }`}
        onClick={() => setAdvOpen(o => !o)}>
        <span className="flex items-center gap-2">
          <OptionsIcon />
          خدمات اضافية
          {hasAdvanced && <span className="w-[7px] h-[7px] rounded-full bg-[#f0b429] inline-block mr-0.5" />}
        </span>
        <span className={`text-lg transition-transform ${advOpen ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      {advOpen && (
        <div className="bg-[#111827] border border-white/[0.07] border-t-0 rounded-b-2xl p-5 mb-4 animate-[slide-in_0.2s_ease]">

          {/* ── Non-standard sub-type (per size) ── */}
          {showNonStdSection && (
            <>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-3">
                <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
                تصنيف الحاوية غير المنتظمة
              </div>
              <div className="flex flex-col gap-3 mb-4">
                {showNonStd20 && (
                  <div>
                    <div className="text-[11px] text-[#4a5568] font-semibold mb-1.5">٢٠ قدم</div>
                    <select
                      className="w-full py-3 px-3.5 pr-9 rounded-xl border-[1.5px] border-white/[0.12] bg-[#1a2035] text-[#f0f2f8] text-[15px] font-medium text-right outline-none transition-all appearance-none focus:border-[#f0b429] focus:shadow-[0_0_0_3px_rgba(240,180,41,0.12)]"
                      style={{
                        direction: 'rtl',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%234a5568' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'left 13px center'
                      }}
                      value={nonStdType20}
                      onChange={e => setNonStdType20(e.target.value)}>
                      <option value="OOG">غير منتظم (الاسبريدر العادى) (OOG) — السعر ×٢</option>
                      <option value="LASHING">تصبين (بالويرات) (Lashing) — السعر ×٤</option>
                    </select>
                  </div>
                )}
                {showNonStd40 && (
                  <div>
                    <div className="text-[11px] text-[#4a5568] font-semibold mb-1.5">٤٠ قدم</div>
                    <select
                      className="w-full py-3 px-3.5 pr-9 rounded-xl border-[1.5px] border-white/[0.12] bg-[#1a2035] text-[#f0f2f8] text-[15px] font-medium text-right outline-none transition-all appearance-none focus:border-[#f0b429] focus:shadow-[0_0_0_3px_rgba(240,180,41,0.12)]"
                      style={{
                        direction: 'rtl',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%234a5568' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'left 13px center'
                      }}
                      value={nonStdType40}
                      onChange={e => setNonStdType40(e.target.value)}>
                      <option value="OOG">غير منتظم (الاسبريدر العادى) (OOG) — السعر ×٢</option>
                      <option value="LASHING">تصبين (بالويرات) (Lashing) — السعر ×٤</option>
                    </select>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Group 1: خدمات المشمول ── */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-2">
              <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
              خدمات المشمول
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* تفريغ مشمول */}
              <div className="flex gap-1.5 items-stretch">
                <CheckLabel checked={hasCargoStripping} onChange={() => setHasCargoStripping(!hasCargoStripping)}>
                  <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">تفريغ مشمول</span>
                </CheckLabel>
                {hasCargoStripping && (
                  <QtyCounter storeKey="stripping" defaultQty={totalConts} />
                )}
              </div>

              {/* أرضيات المشمول */}
              <div className="flex gap-1.5 items-stretch">
                <CheckLabel checked={hasCargoStorage} onChange={() => setHasCargoStorage(!hasCargoStorage)}>
                  <span className="text-[12px] text-[#f0f2f8] flex-1 font-medium truncate">أرضيات المشمول (تفريغ بالساحة)</span>
                </CheckLabel>
                {hasCargoStorage && (
                  <QtyCounter storeKey="cargostorage" defaultQty={totalConts} />
                )}
              </div>

              {/* تاريخ خروج المشمول */}
              {hasCargoStorage && (
                <div className="mt-1 p-4 bg-blue-500/5 rounded-xl border border-blue-500/15 md:col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-[#f0f2f8]">تاريخ خروج المشمول من الحاوية</label>
                  <ArabicDatePicker
                    selected={cargoExitDate}
                    onChange={(date) => setCargoExitDate(date)}
                    placeholderText="اختر تاريخ خروج المشمول"
                    minDate={arrDate}
                    maxDate={relDate}
                  />
                  <div className="text-xs text-[#4a5568] mt-2">
                    💡 يتم حساب أرضيات المشمول من هذا التاريخ حتى تاريخ الصرف بفترة سماح يوم واحد
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Group 2: نوع الصرف ── */}
          <div className="h-px bg-white/[0.05] my-3" />
          <div className="mb-4">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-2">
              <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
              نوع الصرف
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* صرف للتخزين الخارجي */}
              <div className="flex gap-1.5 items-stretch">
                <CheckLabel checked={isExternalStorage} onChange={() => setIsExternalStorage(!isExternalStorage)}>
                  <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">
                    صرف للتخزين الخارجي
                    <span className="text-[10px] block text-[#4a5568] mt-0.5">يلغي فترة السماح</span>
                  </span>
                </CheckLabel>
              </div>

              {/* التخزين بالمخزن المشترك LCL */}
              <div className="flex gap-1.5 items-stretch">
                <CheckLabel checked={isLCLStorage} onChange={() => setIsLCLStorage(!isLCLStorage)}>
                  <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">
                    مخزن مشترك (LCL)
                    <span className="text-[10px] block text-[#4a5568] mt-0.5">سماح 3 أيام + تفريغ بنصف السعر + نقل</span>
                  </span>
                </CheckLabel>
              </div>

              {/* صرف يوم عطلة */}
              <div className="flex gap-1.5 items-stretch">
                <CheckLabel checked={isHolidayRelease} onChange={() => setIsHolidayRelease(!isHolidayRelease)}>
                  <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">
                    صرف يوم عطلة
                    <span className="text-[10px] block text-[#4a5568] mt-0.5">رسوم إضافية ٥٠٪ على الخدمات</span>
                  </span>
                </CheckLabel>
                {isHolidayRelease && (
                  <QtyCounter storeKey="holiday" defaultQty={totalConts} />
                )}
              </div>
            </div>
          </div>

          {/* ── Group 3: خدمات الساحة ── */}
          <div className="h-px bg-white/[0.05] my-3" />
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-2">
              <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
              خدمات الساحة
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

              {/* ── ساحة الطوارئ per-size ── */}
              {showDangerYardSection && (
                <>
                  {canDangerYard20 && (
                    <div className="flex gap-1.5 items-stretch">
                      <CheckLabel
                        checked={hasDangerYard20}
                        onChange={() => setHasDangerYard20(!hasDangerYard20)}
                      >
                        <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">
                          ساحة الطوارئ
                          <span className="text-[10px] block text-[#4a5568] mt-0.5">٢٠ قدم</span>
                        </span>
                      </CheckLabel>
                      {hasDangerYard20 && (
                        <QtyCounter storeKey="dangeryard20" defaultQty={twentyCount} />
                      )}
                    </div>
                  )}

                  {canDangerYard40 && (
                    <div className="flex gap-1.5 items-stretch">
                      <CheckLabel
                        checked={hasDangerYard40}
                        onChange={() => setHasDangerYard40(!hasDangerYard40)}
                      >
                        <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">
                          ساحة الطوارئ
                          <span className="text-[10px] block text-[#4a5568] mt-0.5">٤٠ قدم</span>
                        </span>
                      </CheckLabel>
                      {hasDangerYard40 && (
                        <QtyCounter storeKey="dangeryard40" defaultQty={fortyCount} />
                      )}
                    </div>
                  )}
                </>
              )}

              {/* SERVICES_LIST mapping */}
              {SERVICES_LIST.map(svc => {
                const on = !!services[svc.id];
                const qty = serviceQuantities[svc.id] !== undefined ? serviceQuantities[svc.id] : totalConts;
                let rateToShow;
                if (svc.id === 'yard') {
                  const shiftCfg = STORAGE_CONFIG.SERVICES.SHIFTING.YARD_TO_YARD;
                  if (totalConts > 0) {
                    rateToShow = (
                      (shiftCfg.rate20 * twentyCount * nsMultiplier20 + shiftCfg.rate40 * fortyCount * nsMultiplier40) / totalConts
                    );
                  } else {
                    rateToShow = shiftCfg.rate40 * nsMultiplier40;
                  }
                  if (isHolidayRelease) rateToShow *= 1.5;
                } else {
                  rateToShow = svc.rate * nsMultiplier;
                }
                return (
                  <div key={svc.id} className="flex gap-1.5 items-stretch">
                    <CheckLabel checked={on} onChange={() => toggleService(svc.id)}>
                      <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">{svc.name}</span>
                      <span className="text-[11px] text-[#4a5568] font-bold">
                        ${rateToShow.toFixed(1)}
                      </span>
                    </CheckLabel>
                    {on && (
                      <QtyCounter storeKey={svc.id} defaultQty={totalConts} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

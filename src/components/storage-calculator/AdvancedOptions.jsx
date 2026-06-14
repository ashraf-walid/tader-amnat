'use client';

import { OptionsIcon, CheckIcon } from '@/components/Icons';
import ArabicDatePicker from '@/components/ArabicDatePicker';
import { STORAGE_CONFIG, SERVICES_LIST } from '@/lib/storageConstants';

export default function AdvancedOptions({
  advOpen, setAdvOpen,
  hasAdvanced,
  cargoType, nonStdType, setNonStdType,
  hasCargoStripping, setHasCargoStripping,
  hasCargoStorage, setHasCargoStorage,
  cargoExitDate, setCargoExitDate, arrDate, relDate,
  isExternalStorage, setIsExternalStorage,
  isLCLStorage, setIsLCLStorage,
  isHolidayRelease, setIsHolidayRelease,
  hasDangerYard, setHasDangerYard,
  services, toggleService,
  serviceQuantities, setServiceQuantities,
  twentyCount, fortyCount,
  nsMultiplier
}) {
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
          {/* Non-standard type */}
          {cargoType === "NON_STANDARD" && (
            <>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-3">
                <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
                تصنيف الحاوية غير المنتظمة
              </div>
              <div className="flex flex-col gap-2 mb-4">
                <select
                  className="w-full py-3 px-3.5 pr-9 rounded-xl border-[1.5px] border-white/[0.12] bg-[#1a2035] text-[#f0f2f8] text-[15px] font-medium text-right outline-none transition-all appearance-none focus:border-[#f0b429] focus:shadow-[0_0_0_3px_rgba(240,180,41,0.12)]"
                  style={{
                    direction: 'rtl',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%234a5568' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'left 13px center'
                  }}
                  value={nonStdType}
                  onChange={e => setNonStdType(e.target.value)}>
                  <option value="OOG">غير منتظم (الاسبريدر العادى) (OOG) — السعر ×٢</option>
                  <option value="LASHING">تصبين (بالويرات) (Lashing) — السعر ×٤</option>
                </select>
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
                <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${hasCargoStripping ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}>
                  <input type="checkbox" checked={hasCargoStripping} onChange={() => setHasCargoStripping(!hasCargoStripping)} className="hidden" />
                  <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${hasCargoStripping ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                    {hasCargoStripping && <CheckIcon />}
                  </span>
                  <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">تفريغ مشمول</span>
                </label>
                {hasCargoStripping && (
                  <div className="flex items-center gap-0 w-[90px] rounded-xl border-[1.5px] border-[#f0b429] overflow-hidden">
                    <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                      onClick={() => setServiceQuantities(p => ({ ...p, stripping: Math.max(1, Number(serviceQuantities['stripping'] !== undefined ? serviceQuantities['stripping'] : (twentyCount + fortyCount)) - 1) }))}>−</button>
                    <div className="flex-1 text-center text-sm font-extrabold text-[#f0f2f8] select-none">
                      {serviceQuantities['stripping'] !== undefined ? serviceQuantities['stripping'] : (twentyCount + fortyCount)}
                    </div>
                    <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                      onClick={() => setServiceQuantities(p => ({ ...p, stripping: Number(serviceQuantities['stripping'] !== undefined ? serviceQuantities['stripping'] : (twentyCount + fortyCount)) + 1 }))}>+</button>
                  </div>
                )}
              </div>

              {/* أرضيات المشمول */}
              <div className="flex gap-1.5 items-stretch">
                <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${hasCargoStorage ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}>
                  <input type="checkbox" checked={hasCargoStorage} onChange={() => setHasCargoStorage(!hasCargoStorage)} className="hidden" />
                  <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${hasCargoStorage ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                    {hasCargoStorage && <CheckIcon />}
                  </span>
                  <span className="text-[12px] text-[#f0f2f8] flex-1 font-medium truncate">أرضيات المشمول (تفريغ بالساحة)</span>
                </label>
                {hasCargoStorage && (
                  <div className="flex items-center gap-0 w-[90px] rounded-xl border-[1.5px] border-[#f0b429] overflow-hidden">
                    <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                      onClick={() => setServiceQuantities(p => ({ ...p, cargostorage: Math.max(1, Number(serviceQuantities['cargostorage'] !== undefined ? serviceQuantities['cargostorage'] : (twentyCount + fortyCount)) - 1) }))}>−</button>
                    <div className="flex-1 text-center text-sm font-extrabold text-[#f0f2f8] select-none">
                      {serviceQuantities['cargostorage'] !== undefined ? serviceQuantities['cargostorage'] : (twentyCount + fortyCount)}
                    </div>
                    <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                      onClick={() => setServiceQuantities(p => ({ ...p, cargostorage: Number(serviceQuantities['cargostorage'] !== undefined ? serviceQuantities['cargostorage'] : (twentyCount + fortyCount)) + 1 }))}>+</button>
                  </div>
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
                <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${isExternalStorage ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}>
                  <input type="checkbox" checked={isExternalStorage} onChange={() => setIsExternalStorage(!isExternalStorage)} className="hidden" />
                  <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${isExternalStorage ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                    {isExternalStorage && <CheckIcon />}
                  </span>
                  <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">
                    صرف للتخزين الخارجي
                    <span className="text-[10px] block text-[#4a5568] mt-0.5">يلغي فترة السماح</span>
                  </span>
                </label>
              </div>

              {/* التخزين بالمخزن المشترك LCL */}
              <div className="flex gap-1.5 items-stretch">
                <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${isLCLStorage ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}>
                  <input type="checkbox" checked={isLCLStorage} onChange={() => setIsLCLStorage(!isLCLStorage)} className="hidden" />
                  <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${isLCLStorage ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                    {isLCLStorage && <CheckIcon />}
                  </span>
                  <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">
                    مخزن مشترك (LCL)
                    <span className="text-[10px] block text-[#4a5568] mt-0.5">سماح 3 أيام + تفريغ بنصف السعر + نقل</span>
                  </span>
                </label>
              </div>

              {/* صرف يوم عطلة */}
              <div className="flex gap-1.5 items-stretch">
                <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${isHolidayRelease ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}>
                  <input type="checkbox" checked={isHolidayRelease} onChange={() => setIsHolidayRelease(!isHolidayRelease)} className="hidden" />
                  <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${isHolidayRelease ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                    {isHolidayRelease && <CheckIcon />}
                  </span>
                  <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">
                    صرف يوم عطلة
                    <span className="text-[10px] block text-[#4a5568] mt-0.5">رسوم إضافية ٥٠٪ على الخدمات</span>
                  </span>
                </label>
                {isHolidayRelease && (
                  <div className="flex items-center gap-0 w-[90px] rounded-xl border-[1.5px] border-[#f0b429] overflow-hidden">
                    <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                      onClick={() => setServiceQuantities(p => ({ ...p, holiday: Math.max(1, Number(serviceQuantities['holiday'] !== undefined ? serviceQuantities['holiday'] : (twentyCount + fortyCount)) - 1) }))}>−</button>
                    <div className="flex-1 text-center text-sm font-extrabold text-[#f0f2f8] select-none">
                      {serviceQuantities['holiday'] !== undefined ? serviceQuantities['holiday'] : (twentyCount + fortyCount)}
                    </div>
                    <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                      onClick={() => setServiceQuantities(p => ({ ...p, holiday: Number(serviceQuantities['holiday'] !== undefined ? serviceQuantities['holiday'] : (twentyCount + fortyCount)) + 1 }))}>+</button>
                  </div>
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
              {/* تخزين ساحة الطوارئ */}
              <div className="flex gap-1.5 items-stretch" style={{ opacity: cargoType === "NON_STANDARD" ? 0.5 : 1 }}>
                <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${hasDangerYard ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}
                  style={{ cursor: cargoType === "NON_STANDARD" ? 'not-allowed' : 'pointer' }}>
                  <input type="checkbox" checked={hasDangerYard} onChange={() => setHasDangerYard(!hasDangerYard)} disabled={cargoType === "NON_STANDARD"} className="hidden" />
                  <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${hasDangerYard ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                    {hasDangerYard && <CheckIcon />}
                  </span>
                  <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">ساحة الطوارئ</span>
                </label>
                {hasDangerYard && (
                  <div className="flex items-center gap-0 w-[90px] rounded-xl border-[1.5px] border-[#f0b429] overflow-hidden">
                    <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                      onClick={() => setServiceQuantities(p => ({ ...p, dangeryard: Math.max(1, Number(serviceQuantities['dangeryard'] !== undefined ? serviceQuantities['dangeryard'] : (twentyCount + fortyCount)) - 1) }))}>−</button>
                    <div className="flex-1 text-center text-sm font-extrabold text-[#f0f2f8] select-none">
                      {serviceQuantities['dangeryard'] !== undefined ? serviceQuantities['dangeryard'] : (twentyCount + fortyCount)}
                    </div>
                    <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                      onClick={() => setServiceQuantities(p => ({ ...p, dangeryard: Number(serviceQuantities['dangeryard'] !== undefined ? serviceQuantities['dangeryard'] : (twentyCount + fortyCount)) + 1 }))}>+</button>
                  </div>
                )}
              </div>

              {/* SERVICES_LIST mapping */}
              {SERVICES_LIST.map(svc => {
                const on = !!services[svc.id];
                const qty = serviceQuantities[svc.id] !== undefined ? serviceQuantities[svc.id] : (twentyCount + fortyCount);
                const totalConts = twentyCount + fortyCount;
                let rateToShow;
                if (svc.id === 'yard') {
                  const shiftCfg = STORAGE_CONFIG.SERVICES.SHIFTING.YARD_TO_YARD;
                  if (totalConts > 0) {
                    rateToShow = ((shiftCfg.rate20 * twentyCount + shiftCfg.rate40 * fortyCount) / totalConts) * nsMultiplier;
                  } else {
                    rateToShow = shiftCfg.rate40 * nsMultiplier;
                  }
                  if (isHolidayRelease) {
                    rateToShow *= 1.5;
                  }
                } else {
                  rateToShow = svc.rate * nsMultiplier;
                }
                return (
                  <div key={svc.id} className="flex gap-1.5 items-stretch">
                    <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${on ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleService(svc.id)} className="hidden" />
                      <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${on ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                        {on && <CheckIcon />}
                      </span>
                      <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">{svc.name}</span>
                      <span className="text-[11px] text-[#4a5568] font-bold">
                        ${rateToShow.toFixed(1)}
                      </span>
                    </label>
                    {on && (
                      <div className="flex items-center gap-0 w-[90px] rounded-xl border-[1.5px] border-[#f0b429] overflow-hidden">
                        <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                          onClick={() => setServiceQuantities(p => ({ ...p, [svc.id]: Math.max(1, Number(qty) - 1) }))}>−</button>
                        <div className="flex-1 text-center text-sm font-extrabold text-[#f0f2f8] select-none">{qty}</div>
                        <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                          onClick={() => setServiceQuantities(p => ({ ...p, [svc.id]: Number(qty) + 1 }))}>+</button>
                      </div>
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

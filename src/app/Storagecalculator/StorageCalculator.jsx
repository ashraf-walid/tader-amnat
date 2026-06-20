'use client';

import Link from 'next/link';
import { InfoIcon } from '@/components/Icons';
import AdminNav from '@/components/AdminNav';
import { useStorageCalculator } from '@/hooks/useStorageCalculator';

import ExchangeRateEditor from '@/components/storage-calculator/ExchangeRateEditor';
import DatePickerSection from '@/components/storage-calculator/DatePickerSection';
import BillingTypeSelector from '@/components/storage-calculator/BillingTypeSelector';
import ContainerCountInput from '@/components/storage-calculator/ContainerCountInput';
import CargoTypeSelector from '@/components/storage-calculator/CargoTypeSelector';
import AdvancedOptions from '@/components/storage-calculator/AdvancedOptions';
import CalculateButton from '@/components/storage-calculator/CalculateButton';
import ResultSection from '@/components/storage-calculator/ResultSection';

export default function StorageCalculator({ adminExchangeRate }) {
  const {
    // Primary
    arrDate, setArrDate,
    relDate, setRelDate,
    billingType, setBillingType,
    twentyCount, setTwentyCount,
    fortyCount, setFortyCount,

    // Per-size cargo type
    twentyCargoType, setTwentyCargoType,
    fortyCargoType, setFortyCargoType,

    // Per-size non-standard type
    nonStdType20, setNonStdType20,
    nonStdType40, setNonStdType40,

    // Exchange rate
    isEditingRate, setIsEditingRate,
    isRateOverridden, setIsRateOverridden,
    customRate, setCustomRate,
    exchangeRate,

    // Init
    isInitializing,
    initError,
    initializeAttempts,

    // Attempts
    remainingAttempts,
    attemptsLoading,

    // Advanced
    advOpen, setAdvOpen,
    prevDays, setPrevDays,

    // Features
    isHolidayRelease, setIsHolidayRelease,
    hasCargoStripping, setHasCargoStripping,
    hasDangerYard20, setHasDangerYard20,
    hasDangerYard40, setHasDangerYard40,
    hasCargoStorage, setHasCargoStorage,
    cargoExitDate, setCargoExitDate,
    isExternalStorage, setIsExternalStorage,
    isLCLStorage, setIsLCLStorage,
    services,
    serviceQuantities, setServiceQuantities,

    // Result
    result, setResult,
    error,

    // Derived
    days,
    nsMultiplier20, nsMultiplier40,
    nsMultiplier,
    hasAdvanced,

    // Methods
    calculate,
    toggleService,
    resetForm,
    formatNumber
  } = useStorageCalculator(adminExchangeRate);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir="rtl" style={{ fontFamily: "'Alexandria', system-ui, sans-serif" }}>
      <AdminNav />
      <div className="max-w-[700px] mx-auto px-4 py-6 pb-20">
        {isInitializing && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-3 border-[#f0b429]/30 border-t-[#f0b429] rounded-full animate-spin" />
            <p className="text-sm text-slate-400">جاري تحميل البيانات...</p>
          </div>
        )}

        {initError && !isInitializing && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-4xl">⚠</div>
            <p className="text-[#f87171] text-sm font-semibold text-center">{initError}</p>
            <button
              onClick={initializeAttempts}
              className="px-6 py-2.5 bg-[#f0b429] text-[#020617] rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {!isInitializing && !initError && (
          <>
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-8 pb-5 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-[46px] h-[46px] rounded-[13px] bg-linear-to-br from-[#f0b429] to-[#e8940a] flex items-center justify-center text-[22px] shrink-0 shadow-[0_4px_16px_rgba(240,180,41,0.3)]">
                  ⚓
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight">تقدير فواتير الوارد</h1>
                  <p className="text-xs text-slate-400 mt-0.5">ميناء دمياط / ٢٠ قدم & ٤٠ قدم</p>
                </div>
              </div>
              <Link
                href="/Storagecalculator/rates"
                className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold px-3.5 py-2 rounded-xl border border-blue-500/20 transition-all hover:bg-blue-500/15 no-underline">
                <InfoIcon />
                التعريفات
              </Link>
            </div>

            {/* Exchange Rate Section */}
            <ExchangeRateEditor
              adminExchangeRate={adminExchangeRate}
              isRateOverridden={isRateOverridden}
              setIsRateOverridden={setIsRateOverridden}
              isEditingRate={isEditingRate}
              setIsEditingRate={setIsEditingRate}
              customRate={customRate}
              setCustomRate={setCustomRate}
              exchangeRate={exchangeRate}
              formatNumber={formatNumber}
            />

            {/* Date Picker Section */}
            <DatePickerSection
              arrDate={arrDate}
              setArrDate={setArrDate}
              relDate={relDate}
              setRelDate={setRelDate}
              days={days}
            />

            {/* Billing Type */}
            <BillingTypeSelector
              billingType={billingType}
              setBillingType={setBillingType}
              prevDays={prevDays}
              setPrevDays={setPrevDays}
              days={days}
            />

            {/* Container Counts */}
            <div className="bg-[#111827] border border-white/[0.12] rounded-[20px] p-6 mb-4">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-3">
                <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
                أعداد الحاويات في البوليصة
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <ContainerCountInput label="٢٠ قدم (Twenty-foot)" count={twentyCount} setCount={setTwentyCount} />
                <ContainerCountInput label="٤٠ قدم (Forty-foot)" count={fortyCount} setCount={setFortyCount} />
              </div>
            </div>

            {/* Per-size Cargo Type Selectors */}
            <CargoTypeSelector
              sizeLabel="٢٠ قدم"
              cargoType={twentyCargoType}
              setCargoType={setTwentyCargoType}
              count={twentyCount}
            />
            <CargoTypeSelector
              sizeLabel="٤٠ قدم"
              cargoType={fortyCargoType}
              setCargoType={setFortyCargoType}
              count={fortyCount}
            />

            <AdvancedOptions
              advOpen={advOpen}
              setAdvOpen={setAdvOpen}
              hasAdvanced={hasAdvanced}
              twentyCargoType={twentyCargoType}
              fortyCargoType={fortyCargoType}
              nonStdType20={nonStdType20}
              setNonStdType20={setNonStdType20}
              nonStdType40={nonStdType40}
              setNonStdType40={setNonStdType40}
              hasDangerYard20={hasDangerYard20}
              setHasDangerYard20={setHasDangerYard20}
              hasDangerYard40={hasDangerYard40}
              setHasDangerYard40={setHasDangerYard40}
              hasCargoStripping={hasCargoStripping}
              setHasCargoStripping={setHasCargoStripping}
              hasCargoStorage={hasCargoStorage}
              setHasCargoStorage={setHasCargoStorage}
              cargoExitDate={cargoExitDate}
              setCargoExitDate={setCargoExitDate}
              arrDate={arrDate}
              relDate={relDate}
              isExternalStorage={isExternalStorage}
              setIsExternalStorage={setIsExternalStorage}
              isLCLStorage={isLCLStorage}
              setIsLCLStorage={setIsLCLStorage}
              isHolidayRelease={isHolidayRelease}
              setIsHolidayRelease={setIsHolidayRelease}
              services={services}
              toggleService={toggleService}
              serviceQuantities={serviceQuantities}
              setServiceQuantities={setServiceQuantities}
              twentyCount={twentyCount}
              fortyCount={fortyCount}
              nsMultiplier20={nsMultiplier20}
              nsMultiplier40={nsMultiplier40}
            />

            <CalculateButton
              calculate={calculate}
              attemptsLoading={attemptsLoading}
              remainingAttempts={remainingAttempts}
            />

            {error && (
              <div className="flex items-start gap-2 text-[#f87171] text-[13px] py-3 px-4 bg-[rgba(248,113,113,0.09)] border border-red-500/20 rounded-xl mt-2.5 leading-relaxed">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {result && (
              <ResultSection
                result={result}
                twentyCargoType={twentyCargoType}
                fortyCargoType={fortyCargoType}
                nonStdType20={nonStdType20}
                nonStdType40={nonStdType40}
                formatNumber={formatNumber}
                resetForm={resetForm}
                billingType={billingType}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

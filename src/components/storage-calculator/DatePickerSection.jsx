'use client';

import ArabicDatePicker from '@/components/ArabicDatePicker';
import { ClockIcon } from '@/components/Icons';

export default function DatePickerSection({
  arrDate, setArrDate,
  relDate, setRelDate,
  days
}) {
  return (
    <div className="bg-[#111827] border border-white/[0.12] rounded-[20px] p-6 mb-4">
      {/* Dates */}
      <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-3">
        <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
        تواريخ الوصول والصرف
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ArabicDatePicker
          id="arr"
          label="تاريخ الوصول"
          selected={arrDate}
          onChange={setArrDate}
          maxDate={relDate || undefined}
          placeholderText="يوم / شهر / سنة"
        />
        <ArabicDatePicker
          id="rel"
          label="تاريخ الصرف"
          selected={relDate}
          onChange={setRelDate}
          minDate={arrDate || undefined}
          placeholderText="يوم / شهر / سنة"
        />
      </div>
      {days && (
        <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-[rgba(240,180,41,0.12)] border border-[rgba(240,180,41,0.25)] text-[#f0b429] rounded-full text-[11px] sm:text-[13px] font-bold px-2.5 sm:px-3.5 py-1 sm:py-1.5 mt-3.5 whitespace-nowrap">
          <ClockIcon className="shrink-0" />
          <span className="flex items-center">
            إجمالي المدة:
            <strong className="text-[14px] sm:text-[17px] font-extrabold font-mono mx-1 sm:mx-1.5 text-white bg-[rgba(240,180,41,0.25)] px-1.5 sm:px-2 py-0.5 rounded-md leading-none">
              {days}
            </strong>
            يوم
            <span className="text-[9px] sm:text-[11px] font-normal opacity-80 mr-1 sm:mr-1.5">
              (شاملة فترة السماح)
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

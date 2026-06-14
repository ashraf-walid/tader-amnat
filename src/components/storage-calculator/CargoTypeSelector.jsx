'use client';

export default function CargoTypeSelector({ cargoType, setCargoType }) {
  return (
    <div className="bg-[#111827] border border-white/[0.12] rounded-[20px] p-6 mb-4">
      <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-2">
        <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
        نوع البضاعة
      </div>
      <div className="flex gap-2 flex-wrap mb-2">
        {[
          ["FULL", "عادية"],
          ["REEFER", "ثلاجة ❄️"],
          ["DANGEROUS", "خطرة ⚠️"],
          ["NON_STANDARD", "غير منتظمة"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={`py-2 px-3.5 rounded-full border-[1.5px] text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap ${cargoType === value
              ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)] text-[#f0b429]'
              : 'border-white/[0.12] bg-[#1a2035] text-[#8892a4] hover:text-[#f0f2f8] hover:border-white/[0.12] hover:bg-[#1f2847]'
            }`}
            onClick={() => setCargoType(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {cargoType === "DANGEROUS" && (
        <p className="text-[11px] text-amber-400/80 mt-1 mb-1 flex items-center gap-1.5">
          <span>⚠</span>
          الحساب مبني على درجات الخطورة 3، 4، 5، 8، 9
        </p>
      )}
    </div>
  );
}

'use client';

export default function ContainerCountInput({ count, setCount, label }) {
  const isSelected = count > 0;

  return (
    <div
      className={`flex items-center h-12 border-[1.5px] rounded-xl bg-[#1a2035] overflow-hidden transition-all ${
        isSelected ? 'border-[#f0b429]/60 shadow-[0_0_12px_rgba(240,180,41,0.08)]' : 'border-white/[0.12]'
      }`}
    >
      {/* 1. العنوان في اليمين */}
      <div className="px-3.5 h-full flex items-center text-xs font-bold text-slate-200 border-l border-white/[0.08] bg-white/[0.02] shrink-0 select-none">
        {label}
      </div>

      {/* 2. زر الزيادة [+] مباشرة بعد العنوان */}
      <button
        type="button"
        aria-label={`زيادة ${label}`}
        className="w-12 h-full border-none bg-transparent text-[#8892a4] text-xl font-bold cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429] active:scale-95 shrink-0"
        onClick={() => setCount(c => c + 1)}
      >
        +
      </button>

      {/* 3. عدد الحاويات في المنتصف */}
      <div className="flex-1 text-center text-lg font-extrabold select-none transition-colors">
        <span className={isSelected ? 'text-[#f0b429]' : 'text-[#f0f2f8]'}>
          {count}
        </span>
      </div>

      {/* 4. زر النقص [−] في اليسار */}
      <button
        type="button"
        aria-label={`إنقاص ${label}`}
        disabled={count <= 0}
        className="w-12 h-full border-none bg-transparent text-[#8892a4] text-xl font-bold flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429] active:scale-95 shrink-0 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
        onClick={() => setCount(c => Math.max(0, c - 1))}
      >
        −
      </button>
    </div>
  );
}

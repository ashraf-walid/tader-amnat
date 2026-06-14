'use client';

export default function ContainerCountInput({ count, setCount, label }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-semibold text-[#4a5568] tracking-wider uppercase">{label}</label>
      <div className="flex items-center gap-0 border-[1.5px] border-white/[0.12] rounded-xl bg-[#1a2035] overflow-hidden">
        <button
          className="w-[46px] h-12 border-none bg-transparent text-[#8892a4] text-[22px] cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429] shrink-0"
          onClick={() => setCount(c => Math.max(0, c - 1))}>
          −
        </button>
        <div className="flex-1 text-center text-lg font-extrabold text-[#f0f2f8] select-none">
          {count}
        </div>
        <button
          className="w-[46px] h-12 border-none bg-transparent text-[#8892a4] text-[22px] cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429] shrink-0"
          onClick={() => setCount(c => c + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

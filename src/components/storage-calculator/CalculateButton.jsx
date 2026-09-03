'use client';

import { ArrowLeft } from 'lucide-react';

export default function CalculateButton({ calculate, attemptsLoading, remainingAttempts, isFormDirty }) {
  const isLocked = !attemptsLoading && !isFormDirty;

  return (
    <div className="relative mt-5">
      <button
        className={`w-full py-4 text-base font-extrabold rounded-2xl border-none text-[#0b1120] cursor-pointer tracking-wide transition-all flex items-center justify-center gap-2
          ${isLocked
            ? 'bg-[#4a5568] shadow-none opacity-50 cursor-not-allowed'
            : 'bg-linear-to-br from-[#f0b429] to-[#e8940a] shadow-[0_4px_24px_rgba(240,180,41,0.3)] hover:opacity-90 hover:shadow-[0_6px_32px_rgba(240,180,41,0.4)] active:scale-[0.99]'
          }
          disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={calculate}
        disabled={attemptsLoading || isLocked}
        // disabled={attemptsLoading || remainingAttempts === 0}
        title={isLocked ? 'قم بتعديل أي معطى لإعادة الحساب' : ''}
      >
        {attemptsLoading ? (
          <div className="w-5 h-5 border-2 border-[#0b1120]/30 border-t-[#0b1120] rounded-full animate-spin" />
        ) : (
          <>احسب الفاتورة <ArrowLeft className="w-4 h-4" /></>
        )}
      </button>

      {isLocked && (
        <p className="text-center text-[11px] text-slate-500 mt-2 leading-relaxed">
          ✏️ عدّل أي معطى لإعادة تفعيل الحساب
        </p>
      )}
    </div>
  );
}

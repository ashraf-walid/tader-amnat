'use client';

import { ArrowLeft } from 'lucide-react';

export default function CalculateButton({ calculate, attemptsLoading, remainingAttempts }) {
  return (
    <button
      className="w-full py-4 text-base font-extrabold rounded-2xl border-none bg-linear-to-br from-[#f0b429] to-[#e8940a] text-[#0b1120] cursor-pointer mt-5 tracking-wide shadow-[0_4px_24px_rgba(240,180,41,0.3)] transition-all hover:opacity-90 hover:shadow-[0_6px_32px_rgba(240,180,41,0.4)] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={calculate}
      disabled={attemptsLoading || remainingAttempts === 0}
    >
      {attemptsLoading ? (
        <div className="w-5 h-5 border-2 border-[#0b1120]/30 border-t-[#0b1120] rounded-full animate-spin" />
      ) : (
        <>احسب الفاتورة <ArrowLeft className="w-4 h-4" /></>
      )}
    </button>
  );
}

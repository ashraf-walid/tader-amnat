"use client";

import EmployeeCard from "@/components/EmployeeCard";
import { UsersIcon } from "@/components/Icons";

export default function EmployeesClient({ employees }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_4px_16px_rgba(16,185,129,0.3)] shrink-0">
            <UsersIcon size={20} />
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-800 dark:text-slate-100 m-0">
              الموظفين المتاحين
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 m-0">
              تواصل مع فريق الأمانات المتاح الآن
            </p>
          </div>
        </div>
      </div>

      {/* Employee Grid or Empty State */}
      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
            <UsersIcon size={32} className="text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
            لا يوجد موظفين متاحين حالياً
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
            لا يتوفر موظفين في الوقت الحالي، يرجى المحاولة لاحقاً أو التواصل عبر الواتساب العام.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <EmployeeCard key={emp.id} employee={emp} />
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-slate-400 text-sm">
        نظام أمانات لعرض حسابات العملاء &copy; 2026
      </footer>
    </div>
  );
}

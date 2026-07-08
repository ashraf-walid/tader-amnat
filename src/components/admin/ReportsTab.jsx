"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";
import { PageVisitsSection } from "./VisitsSection";
import { DateReportSection } from "./DateReportSection";
import { InvoicesByDateSection } from "./Invoices";

const REPORT_MODULES = [
  {
    id: "calculator-usage",
    label: "استخدام الحاسبة",
    icon: Icon.Chart,
    component: InvoicesByDateSection,
  },
  {
    id: "new-accounts",
    label: "الحسابات الجديدة",
    icon: Icon.Calendar,
    component: DateReportSection,
  },
  {
    id: "page-visits",
    label: "زيارات الصفحات",
    icon: Icon.Users,
    component: PageVisitsSection,
  },
];

// ─── Main ReportsTab Component ────────────────────────────────────────────────
export default function ReportsTab() {
  const [activeModule, setActiveModule] = useState(REPORT_MODULES[0].id);
  const currentModule = REPORT_MODULES.find((m) => m.id === activeModule) || REPORT_MODULES[0];
  const ActiveReport = currentModule.component;

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-slate-900 rounded-2xl border border-white/[0.08] p-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {REPORT_MODULES.map((module) => {
            const ModuleIcon = module.icon;
            const isActive = activeModule === module.id;
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => setActiveModule(module.id)}
                className={`h-11 rounded-lg border text-[13px] font-bold cursor-pointer transition-all duration-150 inline-flex items-center justify-center gap-2
                  ${isActive
                    ? "bg-sky-500 text-white border-sky-400 shadow-[0_4px_12px_rgba(14,165,233,0.28)]"
                    : "bg-white/[0.04] text-slate-400 border-white/[0.07] hover:bg-white/[0.08] hover:text-slate-200"}`}
              >
                <ModuleIcon />
                {module.label}
              </button>
            );
          })}
        </div>
      </div>

      <ActiveReport />
    </div>
  );
}

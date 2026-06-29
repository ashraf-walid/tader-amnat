"use client";

import { PageVisitsSection } from "./VisitsSection";
import { DateReportSection } from "./DateReportSection";


// ─── Main ReportsTab Component ────────────────────────────────────────────────
export default function ReportsTab() {
  return (
    <div className="flex flex-col gap-5">
      {/* Section 1: Invoices by Date */}
      <InvoicesByDateSection />
      {/* Section 2: Accounts by Date */}
      <DateReportSection />
      {/* Section 3: Page Visits Analytics */}
      <PageVisitsSection />
    </div>
  );
}

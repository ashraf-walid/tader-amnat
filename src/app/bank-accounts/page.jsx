import { requireAuthPage } from "@/lib/auth";
import BankAccountsClient from "./BankAccountsClient";

// ─── Server Component: Auth Guard ────────────────────────────────────────────
export default async function BankAccountsPage() {
  await requireAuthPage();

  return (
    <div
      className="min-h-screen bg-slate-950 font-sans text-slate-100"
      dir="rtl"
    >

      <BankAccountsClient />
    </div>
  );
}

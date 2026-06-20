import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verify } from "jsonwebtoken";
import AdminNav from "@/components/AdminNav";
import BankAccountsClient from "./BankAccountsClient";

// ─── Server Component: Auth Guard ────────────────────────────────────────────
export default async function BankAccountsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    verify(token, process.env.JWT_SECRET);
  } catch {
    redirect("/login");
  }

  return (
    <div
      className="min-h-screen bg-slate-950 font-sans text-slate-100"
      dir="rtl"
    >
      <AdminNav />
      <BankAccountsClient />
    </div>
  );
}

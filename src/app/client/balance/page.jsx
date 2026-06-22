import AdminNav from "@/components/AdminNav";
import ClientBalance from "@/components/ClientBalance";

export const metadata = {
  title: "رصيد الحساب | أمانات",
  description: "عرض الرصيد المالي وتفاصيل العمليات للحساب",
};

export default function ClientBalancePage() {
  return (
    <div className="min-h-screen bg-slate-950" dir="rtl">
      <AdminNav />
      <main className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <ClientBalance />
      </main>
    </div>
  );
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verify } from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";
import EmployeeAvailability from "@/models/EmployeeAvailability";
import AdminNav from "@/components/AdminNav";
import EmployeesClient from "./EmployeesClient";

// ─── Server Component: Auth + Data Fetch ─────────────────────────────────────
export default async function EmployeesPage() {
  // Auth guard: check JWT cookie
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

  // Fetch active employees from MongoDB
  await connectToDatabase();
  const employees = await EmployeeAvailability.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  // Serialize for client
  const serialized = employees.map((emp) => ({
    id: emp._id.toString(),
    name: emp.name,
    phone: emp.phone,
    role: emp.role,
    sortOrder: emp.sortOrder,
  }));

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 dir-rtl"
      dir="rtl"
    >
      <AdminNav />
      <EmployeesClient employees={serialized} />
    </div>
  );
}

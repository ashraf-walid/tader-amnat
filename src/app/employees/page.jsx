import { requireAuthPage } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import EmployeeAvailability from "@/models/EmployeeAvailability";
import EmployeesClient from "./EmployeesClient";

// ─── Server Component: Auth + Data Fetch ─────────────────────────────────────
export default async function EmployeesPage() {
  await requireAuthPage();

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
      className="min-h-screen bg-slate-950"
      dir="rtl"
    >

      <EmployeesClient employees={serialized} />
    </div>
  );
}

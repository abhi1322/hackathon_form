import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getAdminSession } from "@/lib/admin-api-auth";

function AdminDashboardFallback() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="page-shell min-h-screen">
      <Suspense fallback={<AdminDashboardFallback />}>
        <AdminDashboard />
      </Suspense>
    </main>
  );
}

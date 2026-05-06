import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        userName={session.user.name}
        userEmail={session.user.email}
        role={session.user.role}
      />
      <main className="flex-1 overflow-auto bg-parchment px-8 py-10">
        {children}
      </main>
    </div>
  );
}

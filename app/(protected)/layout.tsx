import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";
import { getCurrentUserRole } from "@/lib/data";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const role = await getCurrentUserRole();

  return (
    <div className="min-h-screen md:flex">
      <Sidebar role={role} />
      <main className="flex-1 p-4 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Operations Dashboard</h1>
          <form action={signOut}>
            <Button variant="outline">Sign out</Button>
          </form>
        </div>
        {children}
      </main>
    </div>
  );
}

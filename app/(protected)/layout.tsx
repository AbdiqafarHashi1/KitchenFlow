import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";
import { getCurrentUserRole } from "@/lib/data";
import { AccessRestricted } from "@/components/layout/access-restricted";
import { UserContextError } from "@/lib/permissions";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  let role;

  try {
    role = await getCurrentUserRole();
  } catch (error) {
    if (error instanceof UserContextError) {
      if (error.code === "UNAUTHENTICATED") {
        redirect("/login");
      }

      return (
        <div className="min-h-screen p-4 md:p-8">
          <AccessRestricted
            title="Unable to load account context"
            message={
              process.env.NODE_ENV === "production"
                ? "We could not load your account profile for this workspace."
                : `${error.message}${error.causeDetail ? ` (${error.causeDetail})` : ""}`
            }
          />
        </div>
      );
    }

    throw error;
  }

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

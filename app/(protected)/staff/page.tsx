import Link from "next/link";
import { addAdvance } from "@/actions/operations";
import { addStaff } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

export default async function StaffPage() {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const { data: staff } = await supabase.from("staff").select("*").eq("restaurant_id", restaurantId).order("full_name");

  return (
    <div className="space-y-4">
      <form action={addStaff} className="card grid gap-2 p-4 md:grid-cols-6">
        <Input name="full_name" placeholder="Full name" required />
        <Input name="role" placeholder="Role" required />
        <Input name="phone" placeholder="Phone" />
        <select name="salary_type" className="rounded-xl border border-border bg-black/20 px-3 text-sm"><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="daily">Daily</option></select>
        <Input name="base_salary" type="number" step="0.01" placeholder="Base salary" required />
        <Button>Add Staff</Button>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        {staff?.map((s) => (
          <div key={s.id} className="card space-y-3 p-4">
            <div className="flex items-start justify-between"><div><h2 className="font-semibold">{s.full_name}</h2><p className="text-sm text-muted">{s.role} • {s.phone}</p></div><span className="text-xs text-muted">{s.is_active ? "Active" : "Inactive"}</span></div>
            <p className="text-sm">Salary: {s.salary_type} {formatCurrency(s.base_salary)}</p>
            <div className="flex gap-2">
              <Link href={`/staff/${s.id}`}><Button size="sm" variant="outline">View Profile</Button></Link>
              <form action={addAdvance} className="flex flex-wrap items-center gap-2"><input type="hidden" name="staff_id" value={s.id} /><input type="hidden" name="advance_date" value={new Date().toISOString().slice(0, 10)} /><Input name="amount" type="number" step="0.01" placeholder="Advance" className="h-9 w-28" required /><input type="hidden" name="note" value="Quick advance" /><Button size="sm">Add Advance</Button></form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

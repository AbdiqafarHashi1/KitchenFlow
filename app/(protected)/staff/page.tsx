import Link from "next/link";
import { addAdvance } from "@/actions/operations";
import { addStaff } from "@/actions/admin";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getCurrentRestaurantId, getCurrentUserRole } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";
import { SearchableListSection } from "@/components/search/searchable-list-section";

type StaffListRow = {
  id: string;
  full_name: string;
  role: string;
  phone: string | null;
  salary_type: "monthly" | "weekly" | "daily";
  base_salary: number;
};

type AdvanceSummaryRow = { staff_id: string; amount: number };

function getMonthRange(period: string) {
  const [year, month] = period.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default async function StaffPage({ searchParams }: { searchParams?: { period?: string } }) {
  const supabase = await createClient();
  const role = await getCurrentUserRole();
  const canManageStaff = hasPermission(role, "staff:manage");
  const restaurantId = await getCurrentRestaurantId();
  const currentPeriod = searchParams?.period ?? new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);
  const { start, end } = getMonthRange(currentPeriod);

  const [{ data: staff }, { data: advances }] = await Promise.all([
    supabase.from("staff").select("id,full_name,role,phone,salary_type,base_salary").eq("restaurant_id", restaurantId).order("full_name"),
    supabase.from("staff_advances").select("staff_id,amount").eq("restaurant_id", restaurantId).gte("advance_date", start).lte("advance_date", end)
  ]);

  const typedStaff = (staff ?? []) as StaffListRow[];
  const typedAdvances = (advances ?? []) as AdvanceSummaryRow[];

  const advancesByStaff = new Map<string, number>();
  for (const advance of typedAdvances) {
    advancesByStaff.set(advance.staff_id, (advancesByStaff.get(advance.staff_id) ?? 0) + advance.amount);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Staff & Payroll Operations</h2>
          <p className="text-sm text-muted">Manage team records and track advances/net payable by pay period.</p>
        </div>
        <form className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted">Pay period month</label>
            <Input name="period" type="month" defaultValue={currentPeriod} />
          </div>
          <Button type="submit" variant="outline">Load Period</Button>
        </form>
      </div>

{canManageStaff ? (
  <ActionForm action={addStaff} className="card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
    <p className="text-xs uppercase tracking-wide text-muted md:col-span-2 xl:col-span-6">
      Quick add staff member
    </p>
    <Input name="full_name" placeholder="Full name" required />
    <Input name="role" placeholder="Role" required />
    <Input name="phone" placeholder="Phone" />
    <Select name="salary_type" defaultValue="monthly">
      <option value="monthly">Monthly</option>
      <option value="weekly">Weekly</option>
      <option value="daily">Daily</option>
    </Select>
    <Input name="base_salary" type="number" step="0.01" placeholder="Base salary" required />
    <div className="flex items-end">
      <Button className="w-full">Add Staff</Button>
    </div>
  </ActionForm>
) : (
  <div className="card p-4 text-sm text-muted">
    Staff records are view-only. You can still capture advances.
  </div>
)}

      <div className="card overflow-hidden p-4">
        <h3 className="mb-3 font-medium">Staff roster ({start} to {end})</h3>
        <SearchableListSection placeholder="Search by name, phone, or role..." emptyMessage="No matching staff found.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-4 py-3">Staff</th><th className="px-4 py-3">Salary</th><th className="px-4 py-3">Advances this period</th><th className="px-4 py-3">Net payable (simple)</th><th className="px-4 py-3">Quick advance</th><th className="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody>
              {typedStaff.map((s) => {
                const advancesTotal = advancesByStaff.get(s.id) ?? 0;
                return (
                  <tr key={s.id} data-search-text={`${s.full_name} ${s.role} ${s.phone ?? ""}`} className="border-t border-border/60 text-muted">
                    <td className="px-4 py-3"><p className="text-foreground">{s.full_name}</p><p className="text-xs">{s.role} • {s.phone ?? "No phone"}</p></td>
                    <td className="px-4 py-3">{s.salary_type} {formatCurrency(s.base_salary)}</td>
                    <td className="px-4 py-3">{formatCurrency(advancesTotal)}</td>
                    <td className="px-4 py-3 text-foreground">{formatCurrency(Math.max(s.base_salary - advancesTotal, 0))}</td>
                    <td className="px-4 py-3">
                      <ActionForm action={addAdvance} keepFields={["advance_date", "staff_id", "note"]} className="flex items-center gap-2">
                        <input type="hidden" name="staff_id" value={s.id} />
                        <input type="hidden" name="advance_date" value={today} />
                        <Input name="amount" type="number" step="0.01" placeholder="0.00" className="h-8 w-24" required />
                        <input type="hidden" name="note" value="Quick advance" />
                        <Button size="sm">Add</Button>
                      </ActionForm>
                    </td>
                    <td className="px-4 py-3"><Link href={`/staff/${s.id}`}><Button size="sm" variant="outline">Open</Button></Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </SearchableListSection>
      </div>
    </div>
  );
}

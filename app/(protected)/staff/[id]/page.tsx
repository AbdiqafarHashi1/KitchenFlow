import { addAdvance } from "@/actions/operations";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

function getMonthRange(period: string) {
  const [year, month] = period.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default async function StaffDetailPage({ params, searchParams }: { params: { id: string }; searchParams?: { period?: string } }) {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const currentPeriod = searchParams?.period ?? new Date().toISOString().slice(0, 7);
  const { start, end } = getMonthRange(currentPeriod);
  const today = new Date().toISOString().slice(0, 10);

  const { data: staff } = await supabase.from("staff").select("*").eq("restaurant_id", restaurantId).eq("id", params.id).single();
  const { data: advances } = await supabase.from("staff_advances").select("*").eq("restaurant_id", restaurantId).eq("staff_id", params.id).order("advance_date", { ascending: false });
  const { data: payroll } = await supabase.from("payroll_records").select("*").eq("restaurant_id", restaurantId).eq("staff_id", params.id).order("period_end", { ascending: false }).limit(12);

  if (!staff) return <div className="card p-4">Staff not found.</div>;

  const periodAdvances = (advances ?? []).filter((a) => a.advance_date >= start && a.advance_date <= end);
  const periodAdvancesTotal = periodAdvances.reduce((sum, advance) => sum + advance.amount, 0);
  const net = Math.max((staff.base_salary ?? 0) - periodAdvancesTotal, 0);

  return (
    <div className="space-y-6">
      <div className="card grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs text-muted">Profile</p>
          <p className="text-lg font-semibold">{staff.full_name}</p>
          <p className="text-sm text-muted">{staff.role} • {staff.phone ?? "No phone"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Salary setup</p>
          <p>{staff.salary_type}</p>
          <p className="font-medium text-accent">{formatCurrency(staff.base_salary)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Current period advances</p>
          <p className="text-xl">{formatCurrency(periodAdvancesTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Net payable (simple)</p>
          <p className="text-xl font-semibold text-accent">{formatCurrency(net)}</p>
        </div>
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Advances</h2>
          <form className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Pay period</label>
              <Input name="period" type="month" defaultValue={currentPeriod} />
            </div>
            <Button type="submit" variant="outline">Load</Button>
          </form>
        </div>

        <ActionForm action={addAdvance} keepFields={["staff_id", "advance_date"]} className="grid gap-2 md:grid-cols-4">
          <input type="hidden" name="staff_id" value={staff.id} />
          <Input name="advance_date" type="date" defaultValue={today} required />
          <Input name="amount" type="number" step="0.01" placeholder="Amount" required />
          <Input name="note" placeholder="Reason" />
          <Button>Add Advance</Button>
        </ActionForm>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Note</th></tr></thead>
            <tbody>{advances?.map((a) => <tr key={a.id} className="border-t border-border/60 text-muted"><td className="px-3 py-2">{a.advance_date}</td><td className="px-3 py-2 text-foreground">{formatCurrency(a.amount)}</td><td className="px-3 py-2">{a.note ?? "-"}</td></tr>)}</tbody>
          </table>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-lg font-semibold">Payroll history</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted"><tr><th className="px-3 py-2">Period</th><th className="px-3 py-2">Gross</th><th className="px-3 py-2">Advance deduction</th><th className="px-3 py-2">Net payable</th><th className="px-3 py-2">Status</th></tr></thead>
            <tbody>
              {payroll?.map((p) => (
                <tr key={p.id} className="border-t border-border/60 text-muted">
                  <td className="px-3 py-2">{p.period_start} → {p.period_end}</td>
                  <td className="px-3 py-2">{formatCurrency(p.gross_salary)}</td>
                  <td className="px-3 py-2">{formatCurrency(p.advance_deductions)}</td>
                  <td className="px-3 py-2 text-foreground">{formatCurrency(p.net_payable)}</td>
                  <td className="px-3 py-2">{p.payment_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

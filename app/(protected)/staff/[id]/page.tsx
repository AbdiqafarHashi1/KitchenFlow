import { addAdvance } from "@/actions/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

export default async function StaffDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const { data: staff } = await supabase.from("staff").select("*").eq("restaurant_id", restaurantId).eq("id", params.id).single();
  const { data: advances } = await supabase.from("staff_advances").select("*").eq("restaurant_id", restaurantId).eq("staff_id", params.id).order("advance_date", { ascending: false });
  const { data: payroll } = await supabase.from("payroll_records").select("*").eq("restaurant_id", restaurantId).eq("staff_id", params.id).order("period_end", { ascending: false }).limit(6);

  const advancesTotal = (advances ?? []).reduce((a, c) => a + c.amount, 0);
  const net = (staff?.base_salary ?? 0) - advancesTotal;

  if (!staff) return <div className="card p-4">Staff not found.</div>;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="mb-2 text-lg font-semibold">Profile</h2>
        <p>{staff.full_name} • {staff.role}</p>
        <p className="text-sm text-muted">Phone: {staff.phone ?? "-"} • Start: {staff.start_date ?? "-"}</p>
        <p className="text-sm text-muted">Notes: {staff.notes ?? "-"}</p>
      </div>

      <div className="card p-4">
        <h2 className="mb-2 text-lg font-semibold">Salary Setup</h2>
        <p>{staff.salary_type} • {formatCurrency(staff.base_salary)}</p>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Advances Log</h2>
        <form action={addAdvance} className="grid gap-2 md:grid-cols-4">
          <input type="hidden" name="staff_id" value={staff.id} />
          <Input name="advance_date" type="date" required />
          <Input name="amount" type="number" step="0.01" required />
          <Input name="note" placeholder="Reason" />
          <Button>Add Advance</Button>
        </form>
        {advances?.map((a) => <p key={a.id} className="text-sm text-muted">{a.advance_date} • {formatCurrency(a.amount)} • {a.note ?? "-"}</p>)}
      </div>

      <div className="card p-4">
        <h2 className="mb-2 text-lg font-semibold">Payroll Summary</h2>
        <p className="text-sm text-muted">Base salary: {formatCurrency(staff.base_salary)}</p>
        <p className="text-sm text-muted">Total advances deducted: {formatCurrency(advancesTotal)}</p>
        <p className="text-sm text-muted">Net salary payable (simple): {formatCurrency(net)}</p>
        <div className="mt-3 space-y-1">
          {payroll?.map((p) => <p key={p.id} className="text-sm text-muted">{p.period_start} to {p.period_end} • {p.payment_status} • {formatCurrency(p.net_payable)}</p>)}
        </div>
      </div>
    </div>
  );
}

import { addUnpaidOrder, deleteUnpaidOrder } from "@/actions/operations";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

type UnpaidOrderRow = {
  id: string;
  date: string;
  order_reference: string | null;
  reason: string;
  description: string;
  amount: number;
  note: string | null;
  created_at: string;
};

const reasons = [
  "Customer left without paying",
  "On the house",
  "Complimentary meal",
  "Payment failure",
  "Other",
];

export default async function UnpaidOrdersPage({
  searchParams,
}: {
  searchParams?: { date?: string };
}) {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const selectedDate = searchParams?.date ?? new Date().toISOString().slice(0, 10);

  const { data: unpaidOrders } = await supabase
    .from("unpaid_orders")
    .select("id,date,order_reference,reason,description,amount,note,created_at")
    .eq("restaurant_id", restaurantId)
    .eq("date", selectedDate)
    .order("created_at", { ascending: false })
    .returns<UnpaidOrderRow[]>();

  const totalUnpaid = (unpaidOrders ?? []).reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Unpaid Orders (Sales Adjustment)</h2>
          <p className="text-sm text-muted">
            Record orders that were entered as sales but were not actually paid.
          </p>
        </div>

        <form className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted">Selected date</label>
            <Input name="date" type="date" defaultValue={selectedDate} />
          </div>
          <Button type="submit" variant="outline">
            Load Date
          </Button>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <ActionForm action={addUnpaidOrder} keepFields={["date"]} className="card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          <input type="hidden" name="date" value={selectedDate} />
          <div className="md:col-span-2 xl:col-span-3">
            <p className="text-xs uppercase tracking-wide text-muted">Add unpaid order adjustment</p>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Date</label>
            <Input type="date" value={selectedDate} disabled />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Order reference</label>
            <Input name="order_reference" placeholder="Optional bill/order number" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Reason</label>
            <Select name="reason" defaultValue="" required>
              <option value="">Select reason</option>
              {reasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </Select>
          </div>

          <div className="xl:col-span-2">
            <label className="mb-1 block text-xs text-muted">Description</label>
            <Input name="description" placeholder="Describe what happened" required />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Amount</label>
            <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
          </div>

          <div className="xl:col-span-2">
            <label className="mb-1 block text-xs text-muted">Note</label>
            <Input name="note" placeholder="Optional note" />
          </div>

          <div className="flex items-end">
            <Button className="w-full">Save Adjustment</Button>
          </div>
        </ActionForm>

        <div className="card space-y-2 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Selected day unpaid total</p>
          <p className="text-3xl font-semibold text-accent">{formatCurrency(totalUnpaid)}</p>
          <p className="text-sm text-muted">{unpaidOrders?.length ?? 0} adjustments on {selectedDate}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-medium">Unpaid Orders on {selectedDate}</h3>
          <p className="text-sm text-muted">Total: {formatCurrency(totalUnpaid)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Order Ref</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {unpaidOrders?.length ? (
                unpaidOrders.map((row) => (
                  <tr key={row.id} className="border-t border-border/60 text-muted">
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3">{row.order_reference ?? "-"}</td>
                    <td className="px-4 py-3">{row.reason}</td>
                    <td className="px-4 py-3">{row.description}</td>
                    <td className="px-4 py-3 text-foreground">{formatCurrency(row.amount)}</td>
                    <td className="px-4 py-3">
                      <ActionForm action={deleteUnpaidOrder}>
                        <input type="hidden" name="id" value={row.id} />
                        <Button size="sm" variant="outline">Delete</Button>
                      </ActionForm>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    No unpaid order adjustments for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { addUsage } from "@/actions/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

export default async function UsagePage({ searchParams }: { searchParams?: { date?: string } }) {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const selectedDate = searchParams?.date ?? new Date().toISOString().slice(0, 10);
  const rangeStart = `${selectedDate}T00:00:00.000Z`;
  const rangeEnd = `${selectedDate}T23:59:59.999Z`;

  const [{ data: items }, { data: usageRows }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id,name,unit,average_unit_cost")
      .eq("restaurant_id", restaurantId)
      .eq("active", true)
      .order("name"),
    supabase
      .from("inventory_movements")
      .select("id,quantity,unit_cost,total_cost,note,created_at,inventory_items(name)")
      .eq("restaurant_id", restaurantId)
      .eq("movement_type", "usage")
      .gte("created_at", rangeStart)
      .lte("created_at", rangeEnd)
      .order("created_at", { ascending: false })
  ]);

  const dailyUsageCost = (usageRows ?? []).reduce((sum, row) => sum + (row.total_cost ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Daily Inventory Usage</h2>
          <p className="text-sm text-muted">Record actual stock consumed for gross-by-usage reporting.</p>
        </div>
        <form className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted">Selected date</label>
            <Input name="date" type="date" defaultValue={selectedDate} />
          </div>
          <Button type="submit" variant="outline">Load Date</Button>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <form action={addUsage} className="card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3">
            <p className="text-xs uppercase tracking-wide text-muted">Quick usage entry</p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Date</label>
            <Input name="usage_date" type="date" defaultValue={selectedDate} required />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted">Inventory item</label>
            <select name="inventory_item_id" className="h-10 w-full rounded-xl border border-border bg-black/20 px-3 text-sm" required>
              <option value="">Select item</option>
              {items?.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Quantity used</label>
            <Input name="quantity_used" type="number" step="0.01" placeholder="0.00" required />
          </div>
          <div className="xl:col-span-2">
            <label className="mb-1 block text-xs text-muted">Note</label>
            <Input name="note" placeholder="Optional usage note" />
          </div>
          <div className="flex items-end">
            <Button className="w-full">Save Usage</Button>
          </div>
        </form>

        <div className="card space-y-2 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Selected day summary</p>
          <p className="text-3xl font-semibold text-accent">{formatCurrency(dailyUsageCost)}</p>
          <p className="text-sm text-muted">{usageRows?.length ?? 0} usage entries on {selectedDate}</p>
          <p className="text-xs text-muted">Estimated usage cost = quantity used × current average unit cost at entry time.</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-medium">Usage entries on {selectedDate}</h3>
          <p className="text-sm text-muted">Usage cost total: {formatCurrency(dailyUsageCost)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Date/time</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Qty used</th>
                <th className="px-4 py-3">Avg unit cost</th>
                <th className="px-4 py-3">Est. usage cost</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {usageRows?.length ? usageRows.map((row) => (
                <tr key={row.id} className="border-t border-border/60 text-muted">
                  <td className="px-4 py-3">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-foreground">{(row as { inventory_items?: { name?: string } }).inventory_items?.name ?? "-"}</td>
                  <td className="px-4 py-3">{row.quantity}</td>
                  <td className="px-4 py-3">{formatCurrency(row.unit_cost ?? 0)}</td>
                  <td className="px-4 py-3 text-foreground">{formatCurrency(row.total_cost ?? 0)}</td>
                  <td className="px-4 py-3">{row.note ?? "-"}</td>
                </tr>
              )) : <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No usage entries recorded for this date.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { addPurchase } from "@/actions/operations";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

type PurchaseRow = {
  id: string;
  purchase_date: string;
  supplier_name: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  note: string | null;
  inventory_items: { name: string } | null;
};
type InventoryOptionRow = { id: string; name: string; unit: string };
type SupplierRow = { supplier_name: string | null };

export default async function PurchasesPage({ searchParams }: { searchParams?: { date?: string } }) {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const selectedDate = searchParams?.date ?? new Date().toISOString().slice(0, 10);

  const [{ data: purchases }, { data: items }, { data: suppliers }] = await Promise.all([
    supabase
      .from("purchases")
      .select("*, inventory_items(name)")
      .eq("restaurant_id", restaurantId)
      .eq("purchase_date", selectedDate)
      .order("created_at", { ascending: false })
      .returns<PurchaseRow[]>(),
    supabase.from("inventory_items").select("id,name,unit").eq("restaurant_id", restaurantId).eq("active", true).order("name")
      .returns<InventoryOptionRow[]>(),
    supabase.from("purchases").select("supplier_name").eq("restaurant_id", restaurantId).not("supplier_name", "is", null).order("created_at", { ascending: false })      .limit(80)
      .returns<SupplierRow[]>()
  ]);

  const dailyTotal = (purchases ?? []).reduce((sum, p) => sum + p.total_cost, 0);
  const supplierOptions = Array.from(new Set((suppliers ?? []).map((s) => s.supplier_name?.trim()).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Daily Purchases</h2>
          <p className="text-sm text-muted">Enter stock purchases for the selected day and review totals instantly.</p>
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
        <ActionForm action={addPurchase} keepFields={["purchase_date"]} className="card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          <input type="hidden" name="purchase_date" value={selectedDate} />
          <div className="md:col-span-2 xl:col-span-3">
            <p className="text-xs uppercase tracking-wide text-muted">Quick purchase entry for {selectedDate}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Inventory item</label>
            <Select name="inventory_item_id" required>
              <option value="">Select item</option>
              {items?.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Supplier</label>
            <Input name="supplier_name" placeholder="Reusable supplier" list="supplier-suggestions" />
            <datalist id="supplier-suggestions">
              {supplierOptions.map((supplier) => <option key={supplier} value={supplier} />)}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Quantity</label>
            <Input name="quantity" type="number" step="0.01" placeholder="0.00" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Unit cost</label>
            <Input name="unit_cost" type="number" step="0.01" placeholder="0.00" required />
          </div>
          <div className="xl:col-span-2">
            <label className="mb-1 block text-xs text-muted">Note</label>
            <Input name="note" placeholder="Optional context" />
          </div>
          <div className="flex items-end">
            <Button className="w-full">Save Purchase</Button>
          </div>
        </ActionForm>

        <div className="card space-y-2 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Selected day summary</p>
          <p className="text-3xl font-semibold text-accent">{formatCurrency(dailyTotal)}</p>
          <p className="text-sm text-muted">{purchases?.length ?? 0} purchase entries on {selectedDate}</p>
          <p className="text-xs text-muted">Total cost is computed automatically from quantity × unit cost when saved.</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-medium">Purchases on {selectedDate}</h3>
          <p className="text-sm text-muted">Daily total: {formatCurrency(dailyTotal)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Date</th><th className="px-4 py-3">Item</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Unit cost</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {purchases?.length ? purchases.map((p) => (
                <tr key={p.id} className="border-t border-border/60 text-muted">
                  <td className="px-4 py-3">{p.purchase_date}</td>
                  <td className="px-4 py-3 text-foreground">{p.inventory_items?.name ?? "-"}</td>
                  <td className="px-4 py-3">{p.supplier_name ?? "-"}</td>
                  <td className="px-4 py-3">{p.quantity}</td>
                  <td className="px-4 py-3">{formatCurrency(p.unit_cost)}</td>
                  <td className="px-4 py-3 text-foreground">{formatCurrency(p.total_cost)}</td>
                  <td className="px-4 py-3">{p.note ?? "-"}</td>
                </tr>
              )) : <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No purchases recorded for this date.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

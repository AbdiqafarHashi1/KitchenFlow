import { saveDailyStockCount } from "@/actions/operations";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";
import { calculateUsage } from "@/lib/usage";
import { SearchableListSection } from "@/components/search/searchable-list-section";

type UsageItemRow = {
  id: string;
  name: string;
  unit: string;
  average_unit_cost: number;
  inventory_categories: { name: string } | null;
};
type PurchaseQtyRow = { inventory_item_id: string; quantity: number };
type StockCountRow = {
  id: string;
  inventory_item_id: string;
  count_date: string;
  closing_quantity: number;
  waste_quantity: number;
  note: string | null;
};
type PreviousCountRow = { inventory_item_id: string; count_date: string; closing_quantity: number };

export default async function UsagePage({
  searchParams,
}: {
  searchParams?: { date?: string };
}) {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const selectedDate = searchParams?.date ?? new Date().toISOString().slice(0, 10);

  const [
    { data: items },
    { data: purchases },
    { data: counts },
    { data: previousCounts },
  ] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id,name,unit,average_unit_cost,inventory_categories(name)")
      .eq("restaurant_id", restaurantId)
      .eq("active", true)
      .order("name"),

    supabase
      .from("purchases")
      .select("inventory_item_id,quantity")
      .eq("restaurant_id", restaurantId)
      .eq("purchase_date", selectedDate),

    supabase
      .from("daily_stock_counts")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("count_date", selectedDate),

    supabase
      .from("daily_stock_counts")
      .select("inventory_item_id,count_date,closing_quantity")
      .eq("restaurant_id", restaurantId)
      .lt("count_date", selectedDate)
      .order("count_date", { ascending: false }),
  ]);

  const typedItems = (items ?? []) as UsageItemRow[];
  const typedPurchases = (purchases ?? []) as PurchaseQtyRow[];
  const typedCounts = (counts ?? []) as StockCountRow[];
  const typedPreviousCounts = (previousCounts ?? []) as PreviousCountRow[];

  const purchaseMap = new Map<string, number>();
  for (const p of typedPurchases) {
    purchaseMap.set(
      p.inventory_item_id,
      (purchaseMap.get(p.inventory_item_id) ?? 0) + p.quantity
    );
  }

  const todayCountMap = new Map(typedCounts.map((c) => [c.inventory_item_id, c]));

  const prevMap = new Map<string, number>();
  for (const pc of typedPreviousCounts) {
    if (!prevMap.has(pc.inventory_item_id)) {
      prevMap.set(pc.inventory_item_id, pc.closing_quantity);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Closing Stock & Daily Consumption</h2>
          <p className="text-sm text-muted">
            Enter what remains at end of day. KitchenFlow calculates usage and cost automatically.
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

      <SearchableListSection placeholder="Search by item or category..." emptyMessage="No matching closing stock items found.">
      <div className="card overflow-hidden">
        <div className="border-b border-border p-4">
          <h3 className="font-medium">End-of-day count entry ({selectedDate})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Opening</th>
                <th className="px-3 py-2">Purchased today</th>
                <th className="px-3 py-2">Expected stock</th>
                <th className="px-3 py-2">Closing stock input</th>
              </tr>
            </thead>

            <tbody>
              {typedItems.map((item) => {
                const opening = prevMap.get(item.id) ?? 0;
                const purchased = purchaseMap.get(item.id) ?? 0;
                const saved = todayCountMap.get(item.id);
                const closing = saved?.closing_quantity ?? 0;
                const waste = saved?.waste_quantity ?? 0;

                const calc = calculateUsage({
                  opening,
                  purchases: purchased,
                  closing,
                  waste,
                  averageUnitCost: item.average_unit_cost,
                });
                const expectedStock = opening + purchased - calc.usage;
                const discrepancy = closing - expectedStock;
                const discrepancySize = Math.abs(discrepancy);
                const significantDiscrepancy = discrepancySize >= Math.max(0.5, expectedStock * 0.1);
                const impossible = closing > opening + purchased;

                return (
                  <tr
                    key={item.id}
                    data-search-text={`${item.name} ${item.inventory_categories?.name ?? "Uncategorized"}`}
                    className={`border-t border-border/60 text-muted align-top ${
                      significantDiscrepancy ? "bg-amber-950/20" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-foreground">
                      {item.name} ({item.unit})
                    </td>
                    <td className="px-3 py-2">{item.inventory_categories?.name ?? "Uncategorized"}</td>
                    <td className="px-3 py-2">{opening.toFixed(2)}</td>
                    <td className="px-3 py-2">{purchased.toFixed(2)}</td>
                    <td className="px-3 py-2 text-foreground">{expectedStock.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <ActionForm
                        action={saveDailyStockCount}
                        keepFields={[
                          "count_date",
                          "inventory_item_id",
                          "opening_quantity",
                          "purchases_quantity",
                          "average_unit_cost",
                        ]}
                        className="space-y-2"
                      >
                        <input type="hidden" name="count_date" value={selectedDate} />
                        <input type="hidden" name="inventory_item_id" value={item.id} />
                        <input type="hidden" name="opening_quantity" value={opening} />
                        <input type="hidden" name="purchases_quantity" value={purchased} />
                        <input type="hidden" name="average_unit_cost" value={item.average_unit_cost} />

                        <Input
                          name="closing_quantity"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={String(closing)}
                          className="h-8 min-w-[110px]"
                          required
                        />

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {significantDiscrepancy ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-900/40 px-2 py-1 text-amber-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-200" />
                              discrepancy {discrepancy > 0 ? "+" : ""}{discrepancy.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-emerald-300">No discrepancy</span>
                          )}
                          <span className="text-muted">Usage: {calc.usage.toFixed(2)}</span>
                          <span className="text-muted">Usage cost: {formatCurrency(Math.max(calc.usageCost, 0))}</span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input
                            name="waste_quantity"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={String(waste)}
                            className="h-8"
                            placeholder="Waste"
                          />
                          <Input
                            name="note"
                            placeholder="Optional note"
                            defaultValue={saved?.note ?? ""}
                            className="h-8"
                          />
                        </div>

                        <Button size="sm">Save</Button>

                        {impossible ? (
                          <p className="text-xs text-red-300">
                            Closing stock is higher than available stock for this day.
                          </p>
                        ) : null}
                      </ActionForm>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-border p-4">
          <h3 className="font-medium">Saved counts for {selectedDate}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Closing</th>
                <th className="px-3 py-2">Waste</th>
                <th className="px-3 py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {typedCounts.length ? (
                typedCounts.map((c) => (
                  <tr
                    key={c.id}
                    data-search-text={`${typedItems.find((i) => i.id === c.inventory_item_id)?.name ?? c.inventory_item_id} ${typedItems.find((i) => i.id === c.inventory_item_id)?.inventory_categories?.name ?? "Uncategorized"}`}
                    className="border-t border-border/60 text-muted"
                  >
                    <td className="px-3 py-2">
                      {typedItems.find((i) => i.id === c.inventory_item_id)?.name ??
                        c.inventory_item_id}
                    </td>
                    <td className="px-3 py-2 text-foreground">{c.closing_quantity}</td>
                    <td className="px-3 py-2">{c.waste_quantity}</td>
                    <td className="px-3 py-2">{c.note ?? "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted">
                    No closing counts saved yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </SearchableListSection>
    </div>
  );
}

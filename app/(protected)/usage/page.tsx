import { saveDailyStockCount } from "@/actions/operations";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";
import { calculateUsage } from "@/lib/usage";

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
      .select("id,name,unit,average_unit_cost")
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

  const purchaseMap = new Map<string, number>();
  for (const p of purchases ?? []) {
    purchaseMap.set(
      p.inventory_item_id,
      (purchaseMap.get(p.inventory_item_id) ?? 0) + p.quantity
    );
  }

  const todayCountMap = new Map((counts ?? []).map((c) => [c.inventory_item_id, c]));

  const prevMap = new Map<string, number>();
  for (const pc of previousCounts ?? []) {
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

      <div className="card overflow-hidden">
        <div className="border-b border-border p-4">
          <h3 className="font-medium">End-of-day count entry ({selectedDate})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Opening</th>
                <th className="px-3 py-2">Purchases</th>
                <th className="px-3 py-2">Closing</th>
                <th className="px-3 py-2">Waste</th>
                <th className="px-3 py-2">Usage</th>
                <th className="px-3 py-2">Unit Cost</th>
                <th className="px-3 py-2">Usage Cost</th>
                <th className="px-3 py-2">Note</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {items?.map((item) => {
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

                const impossible = closing > opening + purchased;

                return (
                  <tr key={item.id} className="border-t border-border/60 text-muted align-top">
                    <td className="px-3 py-2 text-foreground">
                      {item.name} ({item.unit})
                    </td>
                    <td className="px-3 py-2">{opening.toFixed(2)}</td>
                    <td className="px-3 py-2">{purchased.toFixed(2)}</td>
                    <td className="px-3 py-2" colSpan={7}>
                      <ActionForm
                        action={saveDailyStockCount}
                        keepFields={[
                          "count_date",
                          "inventory_item_id",
                          "opening_quantity",
                          "purchases_quantity",
                          "average_unit_cost",
                        ]}
                        className="grid grid-cols-[120px_100px_1fr_auto] items-start gap-2"
                      >
                        <input type="hidden" name="count_date" value={selectedDate} />
                        <input type="hidden" name="inventory_item_id" value={item.id} />
                        <input type="hidden" name="opening_quantity" value={opening} />
                        <input type="hidden" name="purchases_quantity" value={purchased} />
                        <input
                          type="hidden"
                          name="average_unit_cost"
                          value={item.average_unit_cost}
                        />

                        <Input
                          name="closing_quantity"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={String(closing)}
                          className="h-8"
                          required
                        />

                        <Input
                          name="waste_quantity"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={String(waste)}
                          className="h-8"
                        />

                        <div className="grid grid-cols-3 gap-2 text-xs text-muted">
                          <p className={calc.usage < 0 ? "text-red-300" : "text-foreground"}>
                            {calc.usage.toFixed(2)}
                          </p>
                          <p>{formatCurrency(item.average_unit_cost)}</p>
                          <p>{formatCurrency(Math.max(calc.usageCost, 0))}</p>
                        </div>

                        <Button size="sm">Save</Button>

                        <Input
                          name="note"
                          placeholder="Optional note"
                          defaultValue={saved?.note ?? ""}
                          className="col-span-3 h-8"
                        />

                        {impossible ? (
                          <p className="col-span-4 text-xs text-red-300">
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
              {counts?.length ? (
                counts.map((c) => (
                  <tr key={c.id} className="border-t border-border/60 text-muted">
                    <td className="px-3 py-2">
                      {(items ?? []).find((i) => i.id === c.inventory_item_id)?.name ??
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
    </div>
  );
}
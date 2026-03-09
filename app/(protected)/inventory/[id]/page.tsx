import { adjustInventory } from "@/actions/operations";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId, getCurrentUserRole } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";

export default async function InventoryDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const role = await getCurrentUserRole();
  const canAdjustInventory = hasPermission(role, "inventory:adjust");
  const restaurantId = await getCurrentRestaurantId();
  const { data: item } = await supabase.from("inventory_items").select("*, inventory_categories(name)").eq("restaurant_id", restaurantId).eq("id", params.id).single();
  const { data: movements } = await supabase.from("inventory_movements").select("*").eq("restaurant_id", restaurantId).eq("inventory_item_id", params.id).order("created_at", { ascending: false }).limit(30);

  if (!item) return <div className="card p-4">Item not found.</div>;

  return (
    <div className="space-y-6">
      <div className="card grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs text-muted">Item</p>
          <p className="text-lg font-semibold">{item.name}</p>
          <p className="text-sm text-muted">{(item as { inventory_categories?: { name?: string } }).inventory_categories?.name ?? "Uncategorized"} • {item.unit}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Current quantity</p>
          <p className="text-3xl font-semibold text-accent">{item.current_quantity}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Minimum quantity</p>
          <p className="text-lg">{item.min_quantity}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Average unit cost</p>
          <p className="text-lg">{formatCurrency(item.average_unit_cost)}</p>
        </div>
      </div>

{canAdjustInventory ? (
  <ActionForm action={adjustInventory} className="card grid gap-3 p-4 md:grid-cols-4">
    <input type="hidden" name="inventory_item_id" value={item.id} />
    <div>
      <label className="mb-1 block text-xs text-muted">Adjustment quantity (+/-)</label>
      <Input name="quantity" type="number" step="0.01" placeholder="0.00" required />
    </div>
    <div className="md:col-span-2">
      <label className="mb-1 block text-xs text-muted">Reason</label>
      <Input name="note" placeholder="Spoilage, count correction, transfer..." />
    </div>
    <div className="flex items-end">
      <Button className="w-full">Apply Stock Adjustment</Button>
    </div>
  </ActionForm>
) : (
  <div className="card p-4 text-sm text-muted">
    Inventory adjustments are restricted for your role.
  </div>
)}
      
      <div className="card overflow-hidden">
        <div className="border-b border-border p-4"><h3 className="font-medium">Movement history</h3></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-4 py-3">Date/Time</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Unit cost</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Note</th></tr>
            </thead>
            <tbody>
              {movements?.map((m) => (
                <tr key={m.id} className="border-t border-border/60 text-muted">
                  <td className="px-4 py-3">{new Date(m.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{m.movement_type}</td>
                  <td className="px-4 py-3 text-foreground">{m.quantity}</td>
                  <td className="px-4 py-3">{m.unit_cost ? formatCurrency(m.unit_cost) : "-"}</td>
                  <td className="px-4 py-3">{m.total_cost ? formatCurrency(m.total_cost) : "-"}</td>
                  <td className="px-4 py-3">{m.note ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

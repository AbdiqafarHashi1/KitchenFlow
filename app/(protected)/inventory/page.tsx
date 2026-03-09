import Link from "next/link";
import { addInventoryItem } from "@/actions/admin";
import { adjustInventory } from "@/actions/operations";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Select } from "@/components/ui/select";
import { getCurrentRestaurantId, getCurrentUserRole } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";

export default async function InventoryPage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole();
  const canManageInventory = hasPermission(role, "inventory:manage");
  const canAdjustInventory = hasPermission(role, "inventory:adjust");
  const restaurantId = await getCurrentRestaurantId();
  const [{ data: items }, { data: categories }] = await Promise.all([
    supabase.from("inventory_items").select("*, inventory_categories(name)").eq("restaurant_id", restaurantId).order("name"),
    supabase.from("inventory_categories").select("id,name").eq("restaurant_id", restaurantId).eq("active", true).order("sort_order")
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Inventory Stock Control</h2>
        <p className="text-sm text-muted">Manage master items, monitor low stock, and perform quick adjustments when needed.</p>
      </div>

      <ActionForm action={addInventoryItem} className="card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">

      {canManageInventory ? (
  <ActionForm action={addInventoryItem} className="card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
    <p className="text-xs uppercase tracking-wide text-muted md:col-span-2 xl:col-span-4">
      Add new inventory item
    </p>
    <Input name="name" placeholder="Item name" required />
    <Select name="category_id" defaultValue="">
      <option value="">Category</option>
      {categories?.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </Select>
    <Input name="unit" placeholder="Unit (kg, pcs...)" required />
    <Input name="current_quantity" type="number" step="0.01" placeholder="Current qty" required />
    <Input name="min_quantity" type="number" step="0.01" placeholder="Min qty" required />
    <Input name="average_unit_cost" type="number" step="0.01" placeholder="Avg cost" required />
    <div className="flex items-end">
      <Button className="w-full">Add Item</Button>
    </div>
  </ActionForm>
) : (
  <div className="card p-4 text-sm text-muted">Inventory items are view-only for your role.</div>
)}
      <div className="card overflow-hidden">
        <div className="border-b border-border p-4"><h3 className="font-medium">Inventory listing</h3></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Item</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Unit</th><th className="px-4 py-3">Current qty</th><th className="px-4 py-3">Min qty</th><th className="px-4 py-3">Avg cost</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((i) => {
                const low = i.current_quantity <= i.min_quantity;
                return (
                  <tr key={i.id} className={`border-t border-border/60 ${low ? "bg-red-950/20" : ""}`}>
                    <td className="px-4 py-3 text-foreground">{i.name}</td>
                    <td className="px-4 py-3 text-muted">{(i as { inventory_categories?: { name?: string } }).inventory_categories?.name ?? "Uncategorized"}</td>
                    <td className="px-4 py-3 text-muted">{i.unit}</td>
                    <td className="px-4 py-3 text-foreground">{i.current_quantity}</td>
                    <td className="px-4 py-3 text-muted">{i.min_quantity}</td>
                    <td className="px-4 py-3 text-muted">{formatCurrency(i.average_unit_cost)}</td>
                    <td className={`px-4 py-3 text-xs ${low ? "text-red-300" : "text-emerald-300"}`}>{low ? "Low stock" : "Healthy"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/inventory/${i.id}`}>
                    <Button size="sm" variant="outline">
                      {canManageInventory ? "View / Edit" : "View"}
                    </Button>
                  </Link>
                  {canAdjustInventory ? (
                    <ActionForm action={adjustInventory} className="flex items-center gap-2">
                      <input type="hidden" name="inventory_item_id" value={i.id} />
                      <Input name="quantity" type="number" step="0.01" placeholder="+/-" className="h-8 w-20" required />
                      <input type="hidden" name="note" value="Quick adjustment" />
                      <Button size="sm">Adjust</Button>
                    </ActionForm>
                  ) : null}

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

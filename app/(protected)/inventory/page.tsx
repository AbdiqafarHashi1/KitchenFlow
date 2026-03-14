import Link from "next/link";
import { addInventoryItem } from "@/actions/admin";
import { adjustInventory } from "@/actions/operations";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getCurrentRestaurantId, getCurrentUserRole } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { hasPermission } from "@/lib/permissions";
import { SearchableListSection } from "@/components/search/searchable-list-section";

type Category = {
  id: string;
  name: string;
};

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  average_unit_cost: number;
  updated_at: string | null;
  inventory_categories?: {
    name?: string;
  } | null;
};

export default async function InventoryPage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole();
  const canManageInventory = hasPermission(role, "inventory:manage");
  const canAdjustInventory = hasPermission(role, "inventory:adjust");
  const restaurantId = await getCurrentRestaurantId();

  const [{ data: rawItems }, { data: rawCategories }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("*, inventory_categories(name)")
      .eq("restaurant_id", restaurantId)
      .order("name"),
    supabase
      .from("inventory_categories")
      .select("id,name")
      .eq("restaurant_id", restaurantId)
      .eq("active", true)
      .order("sort_order"),
  ]);

  const items = (rawItems ?? []) as InventoryItem[];
  const categories = (rawCategories ?? []) as Category[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Inventory Stock Control</h2>
        <p className="text-sm text-muted">
          Manage master items, monitor low stock, and perform quick adjustments when needed.
        </p>
      </div>

      {canManageInventory ? (
        <ActionForm
          action={addInventoryItem}
          className="card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <p className="text-xs uppercase tracking-wide text-muted md:col-span-2 xl:col-span-4">
            Add new inventory item
          </p>

          <Input name="name" placeholder="Item name" required />

          <Select name="category_id" defaultValue="">
            <option value="">Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Input name="unit" placeholder="Unit (kg, pcs...)" required />
          <Input
            name="current_quantity"
            type="number"
            step="0.01"
            placeholder="Current qty"
            required
          />
          <Input
            name="min_quantity"
            type="number"
            step="0.01"
            placeholder="Min qty"
            required
          />
          <Input
            name="average_unit_cost"
            type="number"
            step="0.01"
            placeholder="Avg cost"
            required
          />

          <div className="flex items-end">
            <Button className="w-full">Add Item</Button>
          </div>
        </ActionForm>
      ) : (
        <div className="card p-4 text-sm text-muted">
          Inventory items are view-only for your role.
        </div>
      )}

      <div className="card overflow-hidden p-4">
        <h3 className="mb-3 font-medium">Inventory listing</h3>
        <SearchableListSection placeholder="Search by item or category..." emptyMessage="No matching inventory items found.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Current qty</th>
                <th className="px-4 py-3">Last updated</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => {
                const zeroStock = item.current_quantity <= 0;
                const low = item.current_quantity <= item.min_quantity;
                const statusLabel = zeroStock ? "Out of stock" : low ? "Low stock" : "Healthy";
                const statusClass = zeroStock
                  ? "text-red-200"
                  : low
                    ? "text-amber-300"
                    : "text-emerald-300";
                const rowClass = zeroStock
                  ? "bg-red-950/40"
                  : low
                    ? "bg-amber-950/20"
                    : "";

                return (
                  <tr
                    key={item.id}
                    data-search-text={`${item.name} ${item.inventory_categories?.name ?? "Uncategorized"}`}
                    className={`border-t border-border/60 ${rowClass}`}
                  >
                    <td className="px-4 py-3 text-foreground">
                      <p>{item.name}</p>
                      <p className="text-xs text-muted">{item.unit}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.inventory_categories?.name ?? "Uncategorized"}
                    </td>
                    <td className="px-4 py-3 text-foreground">{item.current_quantity}</td>
                    <td className="px-4 py-3 text-muted">
                      {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : "-"}
                    </td>
                    <td className={`px-4 py-3 text-xs ${statusClass}`}>
                      {statusLabel}
                      {zeroStock ? <span className="ml-2 rounded bg-red-900/40 px-2 py-0.5 text-[10px] uppercase">Zero</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/inventory/${item.id}`}>
                          <Button size="sm" variant="outline">
                            {canManageInventory ? "View / Edit" : "View"}
                          </Button>
                        </Link>

                        {canAdjustInventory ? (
                          <ActionForm action={adjustInventory} className="flex items-center gap-2">
                            <input type="hidden" name="inventory_item_id" value={item.id} />
                            <Input
                              name="quantity"
                              type="number"
                              step="0.01"
                              placeholder="+/-"
                              className="h-8 w-20"
                              required
                            />
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
        </SearchableListSection>
      </div>
    </div>
  );
}

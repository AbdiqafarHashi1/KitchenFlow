import Link from "next/link";
import { addInventoryItem } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

export default async function InventoryPage() {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const [{ data: items }, { data: categories }] = await Promise.all([
    supabase.from("inventory_items").select("*, inventory_categories(name)").eq("restaurant_id", restaurantId).order("name"),
    supabase.from("inventory_categories").select("id,name").eq("restaurant_id", restaurantId).eq("active", true).order("sort_order")
  ]);

  return (
    <div className="space-y-4">
      <form action={addInventoryItem} className="card grid gap-2 p-4 md:grid-cols-7">
        <Input name="name" placeholder="Item name" required />
        <select name="category_id" className="rounded-xl border border-border bg-black/20 px-3 text-sm"><option value="">Category</option>{categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <Input name="unit" placeholder="Unit (kg, pcs...)" required />
        <Input name="current_quantity" type="number" step="0.01" placeholder="Current qty" required />
        <Input name="min_quantity" type="number" step="0.01" placeholder="Min qty" required />
        <Input name="average_unit_cost" type="number" step="0.01" placeholder="Avg cost" required />
        <Button>Add Item</Button>
      </form>
      <div className="grid gap-4 lg:grid-cols-2">
        {items?.map((i) => (
          <Link key={i.id} href={`/inventory/${i.id}`} className="card block p-4">
            <h2 className="font-semibold">{i.name}</h2>
            <p className="text-sm text-muted">{(i as any).inventory_categories?.name ?? "Uncategorized"} • {i.unit}</p>
            <p className="text-sm">Stock: {i.current_quantity} (min {i.min_quantity})</p>
            <p className="text-sm">Avg cost: {formatCurrency(i.average_unit_cost)}</p>
            {i.current_quantity <= i.min_quantity && <p className="mt-1 text-xs text-red-400">Low stock</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}

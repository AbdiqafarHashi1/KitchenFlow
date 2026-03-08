import { addPurchase } from "@/actions/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

export default async function PurchasesPage() {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const [{ data: purchases }, { data: items }] = await Promise.all([
    supabase.from("purchases").select("*, inventory_items(name)").eq("restaurant_id", restaurantId).order("purchase_date", { ascending: false }),
    supabase.from("inventory_items").select("id,name").eq("restaurant_id", restaurantId).eq("active", true).order("name")
  ]);

  return (
    <div className="space-y-4">
      <form action={addPurchase} className="card grid gap-2 p-4 md:grid-cols-7">
        <Input name="purchase_date" type="date" required />
        <Input name="supplier_name" placeholder="Supplier" />
        <select name="inventory_item_id" className="rounded-xl border border-border bg-black/20 px-3 text-sm" required>{items?.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
        <Input name="quantity" type="number" step="0.01" placeholder="Quantity" required />
        <Input name="unit_cost" type="number" step="0.01" placeholder="Unit cost" required />
        <Input name="note" placeholder="Notes" />
        <Button>Add Purchase</Button>
      </form>
      <div className="card p-4">
        {purchases?.map((p) => <p key={p.id} className="text-sm text-muted">{p.purchase_date} • {(p as any).inventory_items?.name} • {p.quantity} @ {formatCurrency(p.unit_cost)} = {formatCurrency(p.total_cost)}</p>)}
      </div>
    </div>
  );
}

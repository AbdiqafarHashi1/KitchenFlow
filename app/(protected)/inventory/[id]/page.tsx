import { adjustInventory } from "@/actions/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";

export default async function InventoryDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const { data: item } = await supabase.from("inventory_items").select("*").eq("restaurant_id", restaurantId).eq("id", params.id).single();
  const { data: movements } = await supabase.from("inventory_movements").select("*").eq("restaurant_id", restaurantId).eq("inventory_item_id", params.id).order("created_at", { ascending: false }).limit(20);

  if (!item) return <div className="card p-4">Item not found.</div>;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="text-lg font-semibold">{item.name}</h2>
        <p className="text-sm text-muted">Current stock: {item.current_quantity} {item.unit}</p>
        <p className="text-sm text-muted">Minimum stock: {item.min_quantity}</p>
      </div>
      <form action={adjustInventory} className="card grid gap-2 p-4 md:grid-cols-4">
        <input type="hidden" name="inventory_item_id" value={item.id} />
        <Input name="quantity" type="number" step="0.01" placeholder="Adjustment (+/-)" required />
        <Input name="note" placeholder="Reason" />
        <Button>Apply Adjustment</Button>
      </form>
      <div className="card p-4">
        <h3 className="mb-2 font-medium">Movement History</h3>
        {movements?.map((m) => <p key={m.id} className="text-sm text-muted">{new Date(m.created_at).toLocaleString()} • {m.movement_type} • {m.quantity}</p>)}
      </div>
    </div>
  );
}

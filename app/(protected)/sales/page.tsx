import { addSale } from "@/actions/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

export default async function SalesPage() {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const { data: sales } = await supabase.from("daily_sales").select("*").eq("restaurant_id", restaurantId).order("sales_date", { ascending: false });

  return (
    <div className="space-y-4">
      <form action={addSale} className="card grid gap-2 p-4 md:grid-cols-5">
        <Input name="sales_date" type="date" required />
        <Input name="sales_amount" type="number" step="0.01" placeholder="Sales amount" required />
        <Input name="source" placeholder="Source (optional)" />
        <Input name="notes" placeholder="Notes" />
        <Button>Add Entry</Button>
      </form>
      <div className="card p-4">
        {sales?.map((s) => <p key={s.id} className="text-sm text-muted">{s.sales_date} • {formatCurrency(s.sales_amount)} • {s.source ?? "General"} • {s.notes ?? "-"}</p>)}
      </div>
    </div>
  );
}

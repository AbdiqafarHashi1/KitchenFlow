import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage() {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();

  const [{ data: sales }, { data: purchases }, { data: payroll }, { data: lowStock }, { data: items }] = await Promise.all([
    supabase.from("daily_sales").select("sales_date,sales_amount").eq("restaurant_id", restaurantId).order("sales_date", { ascending: false }),
    supabase.from("purchases").select("purchase_date,total_cost").eq("restaurant_id", restaurantId).order("purchase_date", { ascending: false }),
    supabase.from("payroll_records").select("period_end,net_payable").eq("restaurant_id", restaurantId).order("period_end", { ascending: false }),
    supabase.from("inventory_items").select("name,current_quantity,min_quantity").eq("restaurant_id", restaurantId).filter("current_quantity", "lte", "min_quantity"),
    supabase.from("inventory_items").select("current_quantity,average_unit_cost").eq("restaurant_id", restaurantId)
  ]);

  const salesTotal = (sales ?? []).reduce((a, b) => a + b.sales_amount, 0);
  const purchaseTotal = (purchases ?? []).reduce((a, b) => a + b.total_cost, 0);
  const payrollTotal = (payroll ?? []).reduce((a, b) => a + b.net_payable, 0);
  const inventoryValue = (items ?? []).reduce((a, b) => a + b.current_quantity * b.average_unit_cost, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4"><p className="text-sm text-muted">Sales Total</p><p className="text-xl text-accent">{formatCurrency(salesTotal)}</p></div>
        <div className="card p-4"><p className="text-sm text-muted">Purchases Total</p><p className="text-xl text-accent">{formatCurrency(purchaseTotal)}</p></div>
        <div className="card p-4"><p className="text-sm text-muted">Payroll Total</p><p className="text-xl text-accent">{formatCurrency(payrollTotal)}</p></div>
        <div className="card p-4"><p className="text-sm text-muted">Gross Profit Estimate</p><p className="text-xl text-accent">{formatCurrency(salesTotal - purchaseTotal - payrollTotal)}</p></div>
      </div>
      <div className="card p-4"><h2 className="mb-2 font-medium">Low Stock Summary</h2>{lowStock?.map((l) => <p key={l.name} className="text-sm text-muted">{l.name} {l.current_quantity}/{l.min_quantity}</p>)}</div>
      <div className="card p-4"><h2 className="mb-2 font-medium">Inventory Valuation Estimate</h2><p className="text-lg text-accent">{formatCurrency(inventoryValue)}</p></div>
    </div>
  );
}

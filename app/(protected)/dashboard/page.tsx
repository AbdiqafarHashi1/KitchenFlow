import { createClient } from "@/lib/supabase-server";
import { getCurrentRestaurantId } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

function Card({ title, value }: { title: string; value: string }) {
  return <div className="card p-4"><p className="text-sm text-muted">{title}</p><p className="mt-2 text-2xl font-semibold text-accent">{value}</p></div>;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: sales }, { data: purchases }, { data: advances }, { data: lowStock }, { data: staff }, { data: payroll }] = await Promise.all([
    supabase.from("daily_sales").select("sales_amount").eq("restaurant_id", restaurantId).eq("sales_date", today),
    supabase.from("purchases").select("total_cost").eq("restaurant_id", restaurantId).eq("purchase_date", today),
    supabase.from("staff_advances").select("amount").eq("restaurant_id", restaurantId).eq("advance_date", today),
    supabase.from("inventory_items").select("id").eq("restaurant_id", restaurantId).filter("current_quantity", "lte", "min_quantity"),
    supabase.from("staff").select("id").eq("restaurant_id", restaurantId).eq("is_active", true),
    supabase.from("payroll_records").select("net_payable").eq("restaurant_id", restaurantId).eq("payment_status", "pending")
  ]);

  const todaySales = (sales ?? []).reduce((a, c) => a + c.sales_amount, 0);
  const todayPurchases = (purchases ?? []).reduce((a, c) => a + c.total_cost, 0);
  const advancesToday = (advances ?? []).reduce((a, c) => a + c.amount, 0);
  const payrollSnapshot = (payroll ?? []).reduce((a, c) => a + c.net_payable, 0);
  const gross = todaySales - todayPurchases - payrollSnapshot;

  const { data: recentPurchases } = await supabase.from("purchases").select("id,supplier_name,total_cost,purchase_date").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(5);
  const { data: recentAdvances } = await supabase.from("staff_advances").select("id,amount,advance_date,note").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(5);
  const { data: movements } = await supabase.from("inventory_movements").select("id,movement_type,quantity,created_at").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(5);
  const { data: lowAlerts } = await supabase.from("inventory_items").select("id,name,current_quantity,min_quantity").eq("restaurant_id", restaurantId).filter("current_quantity", "lte", "min_quantity").limit(5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card title="Today Sales" value={formatCurrency(todaySales)} />
        <Card title="Today Purchases" value={formatCurrency(todayPurchases)} />
        <Card title="Advances Today" value={formatCurrency(advancesToday)} />
        <Card title="Low Stock Items" value={String(lowStock?.length ?? 0)} />
        <Card title="Active Staff" value={String(staff?.length ?? 0)} />
        <Card title="Payroll Snapshot" value={formatCurrency(payrollSnapshot)} />
      </div>

      <div className="card p-4">
        <p className="text-sm text-muted">Gross Profit Estimate</p>
        <p className="mt-2 text-3xl font-semibold text-accent">{formatCurrency(gross)}</p>
        <p className="text-xs text-muted">Sales - Purchases - Payroll (operational estimate)</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4"><h2 className="mb-3 font-medium">Recent Purchases</h2>{recentPurchases?.map((p) => <p key={p.id} className="text-sm text-muted">{p.purchase_date} • {p.supplier_name ?? "Supplier"} • {formatCurrency(p.total_cost)}</p>)}</div>
        <div className="card p-4"><h2 className="mb-3 font-medium">Recent Advances</h2>{recentAdvances?.map((a) => <p key={a.id} className="text-sm text-muted">{a.advance_date} • {formatCurrency(a.amount)} • {a.note ?? "-"}</p>)}</div>
        <div className="card p-4"><h2 className="mb-3 font-medium">Recent Inventory Movements</h2>{movements?.map((m) => <p key={m.id} className="text-sm text-muted">{m.movement_type} • Qty {m.quantity}</p>)}</div>
        <div className="card p-4"><h2 className="mb-3 font-medium">Low Stock Alerts</h2>{lowAlerts?.map((l) => <p key={l.id} className="text-sm text-muted">{l.name}: {l.current_quantity} / min {l.min_quantity}</p>)}</div>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase-server";
import { getCurrentRestaurantId } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function Card({ title, value }: { title: string; value: string }) {
  return <div className="card p-4"><p className="text-sm text-muted">{title}</p><p className="mt-2 text-2xl font-semibold text-accent">{value}</p></div>;
}

export default async function DashboardPage({ searchParams }: { searchParams?: { date?: string } }) {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const selectedDate = searchParams?.date ?? new Date().toISOString().slice(0, 10);
  const rangeStart = `${selectedDate}T00:00:00.000Z`;
  const rangeEnd = `${selectedDate}T23:59:59.999Z`;

  const [{ data: sales }, { data: purchases }, { data: advances }, { data: expenses }, { data: usage }, { data: lowStock }] = await Promise.all([
    supabase.from("daily_sales").select("sales_amount").eq("restaurant_id", restaurantId).eq("sales_date", selectedDate),
    supabase.from("purchases").select("total_cost").eq("restaurant_id", restaurantId).eq("purchase_date", selectedDate),
    supabase.from("staff_advances").select("amount").eq("restaurant_id", restaurantId).eq("advance_date", selectedDate),
    supabase.from("daily_expenses").select("amount").eq("restaurant_id", restaurantId).eq("expense_date", selectedDate),
    supabase.from("inventory_movements").select("total_cost").eq("restaurant_id", restaurantId).eq("movement_type", "usage").gte("created_at", rangeStart).lte("created_at", rangeEnd),
    supabase.from("inventory_items").select("id").eq("restaurant_id", restaurantId).filter("current_quantity", "lte", "min_quantity"),
  ]);

  const todaySales = (sales ?? []).reduce((a, c) => a + c.sales_amount, 0);
  const todayPurchases = (purchases ?? []).reduce((a, c) => a + c.total_cost, 0);
  const advancesToday = (advances ?? []).reduce((a, c) => a + c.amount, 0);
  const expensesToday = (expenses ?? []).reduce((a, c) => a + c.amount, 0);
  const usageCostToday = (usage ?? []).reduce((a, c) => a + (c.total_cost ?? 0), 0);
  const dailyCashResult = todaySales - todayPurchases - advancesToday - expensesToday;
  const dailyGrossFromUsage = todaySales - usageCostToday;

  const [{ data: recentPurchases }, { data: recentAdvances }, { data: movements }, { data: lowAlerts }] = await Promise.all([
    supabase.from("purchases").select("id,supplier_name,total_cost,purchase_date,inventory_items(name)").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(8),
    supabase.from("staff_advances").select("id,amount,advance_date,note,staff(full_name)").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(8),
    supabase.from("inventory_movements").select("id,movement_type,quantity,created_at,inventory_items(name)").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(8),
    supabase.from("inventory_items").select("id,name,current_quantity,min_quantity").eq("restaurant_id", restaurantId).filter("current_quantity", "lte", "min_quantity").limit(8)
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Manager Control Center</h2>
          <p className="text-sm text-muted">Operational snapshot for the selected date with recent activity feeds.</p>
        </div>
        <form className="flex items-end gap-2">
          <div><label className="mb-1 block text-xs text-muted">Selected date</label><Input name="date" type="date" defaultValue={selectedDate} /></div>
          <Button type="submit" variant="outline">Load Day</Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card title="Today Sales" value={formatCurrency(todaySales)} />
        <Card title="Today Purchases" value={formatCurrency(todayPurchases)} />
        <Card title="Advances Today" value={formatCurrency(advancesToday)} />
        <Card title="Expenses Today" value={formatCurrency(expensesToday)} />
        <Card title="Usage Cost Today" value={formatCurrency(usageCostToday)} />
        <Card title="Low Stock Items" value={String(lowStock?.length ?? 0)} />
        <Card title="Daily Cash Result" value={formatCurrency(dailyCashResult)} />
        <Card title="Daily Gross from Usage" value={formatCurrency(dailyGrossFromUsage)} />
      </div>

      <div className="card grid gap-4 p-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted">Daily Cash Result ({selectedDate})</p>
          <p className="mt-2 text-3xl font-semibold text-accent">{formatCurrency(dailyCashResult)}</p>
          <p className="text-xs text-muted">Sales - Purchases - Advances - Daily expenses.</p>
        </div>
        <div>
          <p className="text-sm text-muted">Daily Gross from Usage ({selectedDate})</p>
          <p className="mt-2 text-3xl font-semibold text-accent">{formatCurrency(dailyGrossFromUsage)}</p>
          <p className="text-xs text-muted">Sales - Usage cost (consumed stock only).</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-border p-4"><h3 className="font-medium">Recent Purchases</h3></div>
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><tbody>{recentPurchases?.map((p) => <tr key={p.id} className="border-t border-border/60 text-muted"><td className="px-4 py-2">{p.purchase_date}</td><td className="px-4 py-2">{(p as { inventory_items?: { name?: string } }).inventory_items?.name ?? "Item"}</td><td className="px-4 py-2">{p.supplier_name ?? "Supplier"}</td><td className="px-4 py-2 text-foreground">{formatCurrency(p.total_cost)}</td></tr>)}</tbody></table></div>
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-border p-4"><h3 className="font-medium">Recent Advances</h3></div>
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><tbody>{recentAdvances?.map((a) => <tr key={a.id} className="border-t border-border/60 text-muted"><td className="px-4 py-2">{a.advance_date}</td><td className="px-4 py-2">{(a as { staff?: { full_name?: string } }).staff?.full_name ?? "Staff"}</td><td className="px-4 py-2">{a.note ?? "-"}</td><td className="px-4 py-2 text-foreground">{formatCurrency(a.amount)}</td></tr>)}</tbody></table></div>
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-border p-4"><h3 className="font-medium">Recent Inventory Movements</h3></div>
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><tbody>{movements?.map((m) => <tr key={m.id} className="border-t border-border/60 text-muted"><td className="px-4 py-2">{new Date(m.created_at).toLocaleString()}</td><td className="px-4 py-2">{(m as { inventory_items?: { name?: string } }).inventory_items?.name ?? "Item"}</td><td className="px-4 py-2">{m.movement_type}</td><td className="px-4 py-2 text-foreground">{m.quantity}</td></tr>)}</tbody></table></div>
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-border p-4"><h3 className="font-medium">Low Stock Alerts</h3></div>
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><tbody>{lowAlerts?.map((l) => <tr key={l.id} className="border-t border-border/60 text-muted"><td className="px-4 py-2">{l.name}</td><td className="px-4 py-2">{l.current_quantity}</td><td className="px-4 py-2">min {l.min_quantity}</td></tr>)}</tbody></table></div>
        </div>
      </div>
    </div>
  );
}

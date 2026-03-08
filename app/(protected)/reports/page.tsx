import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

function rangeFromPreset(preset: string) {
  const now = new Date();
  if (preset === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { start: start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
  }
  const today = now.toISOString().slice(0, 10);
  return { start: today, end: today };
}

export default async function ReportsPage({ searchParams }: { searchParams?: { start?: string; end?: string; preset?: string } }) {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const preset = searchParams?.preset ?? "today";
  const presetRange = rangeFromPreset(preset);
  const start = searchParams?.start ?? presetRange.start;
  const end = searchParams?.end ?? presetRange.end;

  const [{ data: sales }, { data: purchases }, { data: payroll }, { data: lowStock }, { data: items }] = await Promise.all([
    supabase.from("daily_sales").select("sales_amount").eq("restaurant_id", restaurantId).gte("sales_date", start).lte("sales_date", end),
    supabase.from("purchases").select("total_cost").eq("restaurant_id", restaurantId).gte("purchase_date", start).lte("purchase_date", end),
    supabase.from("payroll_records").select("net_payable").eq("restaurant_id", restaurantId).gte("period_end", start).lte("period_end", end),
    supabase.from("inventory_items").select("name,current_quantity,min_quantity").eq("restaurant_id", restaurantId).filter("current_quantity", "lte", "min_quantity"),
    supabase.from("inventory_items").select("current_quantity,average_unit_cost").eq("restaurant_id", restaurantId)
  ]);

  const salesTotal = (sales ?? []).reduce((a, b) => a + b.sales_amount, 0);
  const purchaseTotal = (purchases ?? []).reduce((a, b) => a + b.total_cost, 0);
  const payrollTotal = (payroll ?? []).reduce((a, b) => a + b.net_payable, 0);
  const inventoryValue = (items ?? []).reduce((a, b) => a + b.current_quantity * b.average_unit_cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Operations Reports</h2>
          <p className="text-sm text-muted">Analyze sales, spend, payroll, and stock health for a chosen reporting range.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports?preset=today"><Button variant="outline" size="sm">Today</Button></Link>
          <Link href="/reports?preset=week"><Button variant="outline" size="sm">This Week</Button></Link>
          <Link href="/reports?preset=month"><Button variant="outline" size="sm">This Month</Button></Link>
        </div>
      </div>

      <form className="card flex flex-wrap items-end gap-3 p-4">
        <div><label className="mb-1 block text-xs text-muted">Start date</label><Input name="start" type="date" defaultValue={start} /></div>
        <div><label className="mb-1 block text-xs text-muted">End date</label><Input name="end" type="date" defaultValue={end} /></div>
        <Button type="submit">Apply Range</Button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="card p-4"><p className="text-sm text-muted">Sales Total</p><p className="mt-2 text-2xl text-accent">{formatCurrency(salesTotal)}</p></div>
        <div className="card p-4"><p className="text-sm text-muted">Purchases Total</p><p className="mt-2 text-2xl text-accent">{formatCurrency(purchaseTotal)}</p></div>
        <div className="card p-4"><p className="text-sm text-muted">Payroll Total</p><p className="mt-2 text-2xl text-accent">{formatCurrency(payrollTotal)}</p></div>
        <div className="card p-4"><p className="text-sm text-muted">Gross Profit Estimate</p><p className="mt-2 text-2xl text-accent">{formatCurrency(salesTotal - purchaseTotal - payrollTotal)}</p></div>
        <div className="card p-4"><p className="text-sm text-muted">Low Stock Items</p><p className="mt-2 text-2xl text-accent">{lowStock?.length ?? 0}</p></div>
        <div className="card p-4"><p className="text-sm text-muted">Inventory Valuation Estimate</p><p className="mt-2 text-2xl text-accent">{formatCurrency(inventoryValue)}</p></div>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 font-medium">Low stock summary</h3>
        <div className="grid gap-2 text-sm text-muted md:grid-cols-2">
          {lowStock?.length ? lowStock.map((item) => <p key={item.name}>{item.name}: {item.current_quantity} / min {item.min_quantity}</p>) : <p>No low stock items.</p>}
        </div>
      </div>
    </div>
  );
}

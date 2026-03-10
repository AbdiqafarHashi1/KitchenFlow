import { AccessRestricted } from "@/components/layout/access-restricted";
import { hasPermission } from "@/lib/permissions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId, getCurrentUserRole } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

type SalesAmountRow = { sales_amount: number };
type TotalCostRow = { total_cost: number };
type AmountRow = { amount: number };
type PayrollRow = { net_payable: number };
type UsageRow = { total_cost: number | null; created_at: string };
type CountDateRow = { count_date: string };
type LowStockRow = { name: string; current_quantity: number; min_quantity: number };
type InventoryValueRow = { current_quantity: number; average_unit_cost: number };

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

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: { start?: string; end?: string; preset?: string };
}) {
  const supabase = await createClient();
  const role = await getCurrentUserRole();

  if (!hasPermission(role, "reports:view")) {
    return <AccessRestricted message="Reports are available to admin users only." />;
  }

  const restaurantId = await getCurrentRestaurantId();
  const preset = searchParams?.preset ?? "today";
  const presetRange = rangeFromPreset(preset);
  const start = searchParams?.start ?? presetRange.start;
  const end = searchParams?.end ?? presetRange.end;

  const startTs = `${start}T00:00:00.000Z`;
  const endTs = `${end}T23:59:59.999Z`;

  const [
    { data: sales },
    { data: purchases },
    { data: advances },
    { data: expenses },
    { data: lowStock },
    { data: items },
    { data: payroll },
    { data: usage },
    { data: counts },
  ] = await Promise.all([
    supabase
      .from("daily_sales")
      .select("sales_amount")
      .eq("restaurant_id", restaurantId)
      .gte("sales_date", start)
      .lte("sales_date", end)
      .returns<SalesAmountRow[]>(),

    supabase
      .from("purchases")
      .select("total_cost")
      .eq("restaurant_id", restaurantId)
      .gte("purchase_date", start)
      .lte("purchase_date", end)
      .returns<TotalCostRow[]>(),

    supabase
      .from("staff_advances")
      .select("amount")
      .eq("restaurant_id", restaurantId)
      .gte("advance_date", start)
      .lte("advance_date", end)
      .returns<AmountRow[]>(),

    supabase
      .from("daily_expenses")
      .select("amount")
      .eq("restaurant_id", restaurantId)
      .gte("expense_date", start)
      .lte("expense_date", end)
      .returns<AmountRow[]>(),

    supabase
      .from("inventory_items")
      .select("name,current_quantity,min_quantity")
      .eq("restaurant_id", restaurantId)
      .filter("current_quantity", "lte", "min_quantity")
      .returns<LowStockRow[]>(),

    supabase
      .from("inventory_items")
      .select("current_quantity,average_unit_cost")
      .eq("restaurant_id", restaurantId)
      .returns<InventoryValueRow[]>(),

    supabase
      .from("payroll_records")
      .select("net_payable")
      .eq("restaurant_id", restaurantId)
      .eq("payment_status", "pending")
      .returns<PayrollRow[]>(),

    supabase
      .from("inventory_movements")
      .select("total_cost,created_at")
      .eq("restaurant_id", restaurantId)
      .eq("movement_type", "usage")
      .gte("created_at", startTs)
      .lte("created_at", endTs)
      .returns<UsageRow[]>(),

    supabase
      .from("daily_stock_counts")
      .select("count_date")
      .eq("restaurant_id", restaurantId)
      .gte("count_date", start)
      .lte("count_date", end)
      .returns<CountDateRow[]>(),
  ]);

  const salesTotal = (sales ?? []).reduce((a, b) => a + b.sales_amount, 0);
  const purchaseTotal = (purchases ?? []).reduce((a, b) => a + b.total_cost, 0);
  const advancesTotal = (advances ?? []).reduce((a, b) => a + b.amount, 0);
  const expensesTotal = (expenses ?? []).reduce((a, b) => a + b.amount, 0);
  const payrollTotal = (payroll ?? []).reduce((a, b) => a + b.net_payable, 0);
  const usageCostTotal = (usage ?? []).reduce((a, b) => a + (b.total_cost ?? 0), 0);
  const inventoryValue = (items ?? []).reduce((a, b) => a + b.current_quantity * b.average_unit_cost, 0);
  const dailyCashResult = salesTotal - purchaseTotal - advancesTotal - expensesTotal;
  const dailyGrossFromUsage = salesTotal - usageCostTotal;
  const hasClosingCounts = (counts?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Operations Reports</h2>
          <p className="text-sm text-muted">
            Analyze sales, spend, payroll, and stock health for a chosen reporting range.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/reports?preset=today">
            <Button variant="outline" size="sm">
              Today
            </Button>
          </Link>
          <Link href="/reports?preset=week">
            <Button variant="outline" size="sm">
              This Week
            </Button>
          </Link>
          <Link href="/reports?preset=month">
            <Button variant="outline" size="sm">
              This Month
            </Button>
          </Link>
        </div>
      </div>

      <form className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Start date</label>
          <Input name="start" type="date" defaultValue={start} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">End date</label>
          <Input name="end" type="date" defaultValue={end} />
        </div>
        <Button type="submit">Apply Range</Button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-muted">Sales Total</p>
          <p className="mt-2 text-2xl text-accent">{formatCurrency(salesTotal)}</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-muted">Purchases Total</p>
          <p className="mt-2 text-2xl text-accent">{formatCurrency(purchaseTotal)}</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-muted">Advances Total</p>
          <p className="mt-2 text-2xl text-accent">{formatCurrency(advancesTotal)}</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-muted">Daily Expenses Total</p>
          <p className="mt-2 text-2xl text-accent">{formatCurrency(expensesTotal)}</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-muted">Payroll Total</p>
          <p className="mt-2 text-2xl text-accent">{formatCurrency(payrollTotal)}</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-muted">Usage Cost Total</p>
          <p className="mt-2 text-2xl text-accent">{formatCurrency(usageCostTotal)}</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-muted">Daily Cash Result</p>
          <p className="mt-2 text-2xl text-accent">{formatCurrency(dailyCashResult)}</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-muted">Daily Gross from Usage</p>
          {hasClosingCounts ? (
            <p className="mt-2 text-2xl text-accent">{formatCurrency(dailyGrossFromUsage)}</p>
          ) : (
            <p className="mt-2 text-sm text-amber-300">
              Daily gross from usage pending closing stock count.
            </p>
          )}
        </div>

        <div className="card p-4">
          <p className="text-sm text-muted">Low Stock Items</p>
          <p className="mt-2 text-2xl text-accent">{lowStock?.length ?? 0}</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-muted">Inventory Valuation Estimate</p>
          <p className="mt-2 text-2xl text-accent">{formatCurrency(inventoryValue)}</p>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 font-medium">Low stock summary</h3>
        <div className="grid gap-2 text-sm text-muted md:grid-cols-2">
          {lowStock?.length ? (
            lowStock.map((item) => (
              <p key={item.name}>
                {item.name}: {item.current_quantity} / min {item.min_quantity}
              </p>
            ))
          ) : (
            <p>No low stock items.</p>
          )}
        </div>
      </div>
    </div>
  );
}
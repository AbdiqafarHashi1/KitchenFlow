import { createClient } from "@/lib/supabase-server";
import { getCurrentRestaurantId } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PrintDailyReportButton } from "@/components/print/print-daily-report-button";

type SalesSummaryRow = { sales_amount: number };
type UnpaidSummaryRow = { amount: number };
type PurchaseSummaryRow = { total_cost: number };
type AmountRow = { amount: number };
type UsageCostRow = { total_cost: number | null };
type InventoryIdRow = { id: string };
type LowAlertRow = { id: string; name: string; current_quantity: number; min_quantity: number };
type ItemNameRelation = { inventory_items: { name: string } | null };
type StaffNameRelation = { staff: { full_name: string } | null };
type RecentPurchaseRow = {
  id: string;
  supplier_name: string | null;
  total_cost: number;
  purchase_date: string;
} & ItemNameRelation;
type RecentAdvanceRow = {
  id: string;
  amount: number;
  advance_date: string;
  note: string | null;
} & StaffNameRelation;
type RecentMovementRow = {
  id: string;
  movement_type: "purchase" | "usage" | "waste" | "adjustment";
  quantity: number;
  created_at: string;
} & ItemNameRelation;
type RestaurantRow = { name: string };

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-accent">{value}</p>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { date?: string };
}) {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const selectedDate = searchParams?.date ?? new Date().toISOString().slice(0, 10);
  const rangeStart = `${selectedDate}T00:00:00.000Z`;
  const rangeEnd = `${selectedDate}T23:59:59.999Z`;

  const [
    { data: restaurant },
    { data: sales },
    { data: unpaidOrders },
    { data: purchases },
    { data: advances },
    { data: expenses },
    { data: lowStock },
    { data: usageMovements },
    { data: closingCounts },
  ] = await Promise.all([
    supabase
      .from("restaurants")
      .select("name")
      .eq("id", restaurantId)
      .returns<RestaurantRow[]>(),

    supabase
      .from("daily_sales")
      .select("sales_amount")
      .eq("restaurant_id", restaurantId)
      .eq("sales_date", selectedDate)
      .returns<SalesSummaryRow[]>(),

    supabase
      .from("unpaid_orders")
      .select("amount")
      .eq("restaurant_id", restaurantId)
      .eq("date", selectedDate)
      .returns<UnpaidSummaryRow[]>(),

    supabase
      .from("purchases")
      .select("total_cost")
      .eq("restaurant_id", restaurantId)
      .eq("purchase_date", selectedDate)
      .returns<PurchaseSummaryRow[]>(),

    supabase
      .from("staff_advances")
      .select("amount")
      .eq("restaurant_id", restaurantId)
      .eq("advance_date", selectedDate)
      .returns<AmountRow[]>(),

    supabase
      .from("daily_expenses")
      .select("amount")
      .eq("restaurant_id", restaurantId)
      .eq("expense_date", selectedDate)
      .returns<AmountRow[]>(),

    supabase
      .from("inventory_items")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .filter("current_quantity", "lte", "min_quantity")
      .returns<InventoryIdRow[]>(),

    supabase
      .from("inventory_movements")
      .select("total_cost")
      .eq("restaurant_id", restaurantId)
      .eq("movement_type", "usage")
      .gte("created_at", rangeStart)
      .lte("created_at", rangeEnd)
      .returns<UsageCostRow[]>(),

    supabase
      .from("daily_stock_counts")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("count_date", selectedDate)
      .returns<InventoryIdRow[]>(),
  ]);

  const todaySales = (sales ?? []).reduce((a, c) => a + c.sales_amount, 0);
  const unpaidOrdersToday = (unpaidOrders ?? []).reduce((a, c) => a + c.amount, 0);
  const netSalesToday = todaySales - unpaidOrdersToday;
  const todayPurchases = (purchases ?? []).reduce((a, c) => a + c.total_cost, 0);
  const advancesToday = (advances ?? []).reduce((a, c) => a + c.amount, 0);
  const expensesToday = (expenses ?? []).reduce((a, c) => a + c.amount, 0);
  const usageCostToday = (usageMovements ?? []).reduce((a, c) => a + (c.total_cost ?? 0), 0);
  const lowStockCount = lowStock?.length ?? 0;
  const foodCostPct = netSalesToday > 0 ? (usageCostToday / netSalesToday) * 100 : 0;
  const grossProfit = netSalesToday - usageCostToday;

  const dailyCashResult = netSalesToday - todayPurchases - advancesToday - expensesToday;
  const dailyGrossFromUsage = netSalesToday - usageCostToday;
  const usageReady = (closingCounts?.length ?? 0) > 0;

  const [
    { data: recentPurchases },
    { data: recentAdvances },
    { data: movements },
    { data: lowAlerts },
  ] = await Promise.all([
    supabase
      .from("purchases")
      .select("id,supplier_name,total_cost,purchase_date,inventory_items(name)")
      .eq("restaurant_id", restaurantId)
      .eq("purchase_date", selectedDate)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<RecentPurchaseRow[]>(),

    supabase
      .from("staff_advances")
      .select("id,amount,advance_date,note,staff(full_name)")
      .eq("restaurant_id", restaurantId)
      .eq("advance_date", selectedDate)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<RecentAdvanceRow[]>(),

    supabase
      .from("inventory_movements")
      .select("id,movement_type,quantity,created_at,inventory_items(name)")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", rangeStart)
      .lte("created_at", rangeEnd)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<RecentMovementRow[]>(),

    supabase
      .from("inventory_items")
      .select("id,name,current_quantity,min_quantity")
      .eq("restaurant_id", restaurantId)
      .filter("current_quantity", "lte", "min_quantity")
      .limit(8)
      .returns<LowAlertRow[]>(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-semibold">Manager Control Center</h2>
          <p className="text-sm text-muted">
            Operational snapshot for the selected date with recent activity feeds.
          </p>
        </div>

        <form className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted">Selected date</label>
            <Input name="date" type="date" defaultValue={selectedDate} />
          </div>
          <Button type="submit" variant="outline">
            Load Day
          </Button>
        </form>

        <div className="print:hidden">
          <PrintDailyReportButton />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
        <Card title="Today Sales" value={formatCurrency(todaySales)} />
        <Card title="Unpaid Orders Today" value={formatCurrency(unpaidOrdersToday)} />
        <Card title="Today Purchases" value={formatCurrency(todayPurchases)} />
        <Card title="Advances Today" value={formatCurrency(advancesToday)} />
        <Card title="Expenses Today" value={formatCurrency(expensesToday)} />
        <Card title="Usage Cost Today" value={formatCurrency(usageCostToday)} />
        <Card title="Low Stock Items" value={String(lowStockCount)} />
        <Card title="Daily Cash Result" value={formatCurrency(dailyCashResult)} />
        <Card
          title="Daily Gross from Usage"
          value={usageReady ? formatCurrency(dailyGrossFromUsage) : "Pending closing stock"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2 print:hidden">
        <div className="card overflow-hidden">
          <div className="border-b border-border p-4">
            <h3 className="font-medium">Recent Purchases ({selectedDate})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <tbody>
                {recentPurchases?.map((p) => (
                  <tr key={p.id} className="border-t border-border/60 text-muted">
                    <td className="px-4 py-2">{p.purchase_date}</td>
                    <td className="px-4 py-2">
                      {p.inventory_items?.name ?? "Item"}
                    </td>
                    <td className="px-4 py-2">{p.supplier_name ?? "Supplier"}</td>
                    <td className="px-4 py-2 text-foreground">{formatCurrency(p.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-border p-4">
            <h3 className="font-medium">Recent Advances ({selectedDate})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <tbody>
                {recentAdvances?.map((a) => (
                  <tr key={a.id} className="border-t border-border/60 text-muted">
                    <td className="px-4 py-2">{a.advance_date}</td>
                    <td className="px-4 py-2">
                      {a.staff?.full_name ?? "Staff"}
                    </td>
                    <td className="px-4 py-2">{a.note ?? "-"}</td>
                    <td className="px-4 py-2 text-foreground">{formatCurrency(a.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-border p-4">
            <h3 className="font-medium">Recent Inventory Movements ({selectedDate})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <tbody>
                {movements?.map((m) => (
                  <tr key={m.id} className="border-t border-border/60 text-muted">
                    <td className="px-4 py-2">{new Date(m.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      {m.inventory_items?.name ?? "Item"}
                    </td>
                    <td className="px-4 py-2">{m.movement_type}</td>
                    <td className="px-4 py-2 text-foreground">{m.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-border p-4">
            <h3 className="font-medium">Low Stock Alerts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <tbody>
                {lowAlerts?.map((l) => (
                  <tr key={l.id} className="border-t border-border/60 text-muted">
                    <td className="px-4 py-2">{l.name}</td>
                    <td className="px-4 py-2">{l.current_quantity}</td>
                    <td className="px-4 py-2">min {l.min_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card p-4 print-report print:rounded-none print:border-none print:bg-white print:p-0 print:text-black">
        <div className="mb-4 border-b border-border pb-3 print:border-black">
          <h3 className="text-xl font-semibold">Restaurant Daily Report</h3>
          <p className="text-sm text-muted print:text-black/80">{restaurant?.[0]?.name ?? "Restaurant"}</p>
          <p className="text-sm text-muted print:text-black/80">Date: {selectedDate}</p>
        </div>

        <div className="space-y-6 text-sm">
          <section>
            <h4 className="mb-2 font-semibold tracking-wide">SALES</h4>
            <div className="space-y-1">
              <Row label="Gross Sales" value={formatCurrency(todaySales)} />
              <Row label="Unpaid Orders (Sales Adjustment)" value={formatCurrency(unpaidOrdersToday)} />
              <Row label="Net Sales" value={formatCurrency(netSalesToday)} strong />
            </div>
          </section>

          <section>
            <h4 className="mb-2 font-semibold tracking-wide">FOOD PERFORMANCE</h4>
            <div className="space-y-1">
              <Row label="Usage Cost" value={formatCurrency(usageCostToday)} />
              <Row label="Gross Profit" value={formatCurrency(grossProfit)} strong />
              <Row label="Food Cost %" value={`${foodCostPct.toFixed(2)}%`} />
            </div>
          </section>

          <section>
            <h4 className="mb-2 font-semibold tracking-wide">COSTS</h4>
            <div className="space-y-1">
              <Row label="Purchases" value={formatCurrency(todayPurchases)} />
              <Row label="Expenses" value={formatCurrency(expensesToday)} />
              <Row label="Advances" value={formatCurrency(advancesToday)} />
            </div>
          </section>

          <section>
            <h4 className="mb-2 font-semibold tracking-wide">RESULT</h4>
            <div className="space-y-1">
              <Row label="Daily Cash Result" value={formatCurrency(dailyCashResult)} strong />
              <Row label="Low Stock Items" value={String(lowStockCount)} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-1 print:border-black/20">
      <span className={strong ? "font-semibold" : ""}>{label}</span>
      <span className={strong ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

import { addSale } from "@/actions/operations";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

type SalesRow = {
  id: string;
  sales_date: string;
  sales_amount: number;
  source: string | null;
  notes: string | null;
};

export default async function SalesPage({ searchParams }: { searchParams?: { date?: string } }) {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const selectedDate = searchParams?.date ?? new Date().toISOString().slice(0, 10);

  const [{ data: sales }, { data: recentSales }] = await Promise.all([
    supabase
      .from("daily_sales")
      .select("id,sales_date,sales_amount,source,notes")
      .eq("restaurant_id", restaurantId)
      .eq("sales_date", selectedDate)
      .order("created_at", { ascending: false })
      .returns<SalesRow[]>(),
    supabase
      .from("daily_sales")
      .select("id,sales_date,sales_amount,source,notes")
      .eq("restaurant_id", restaurantId)
      .order("sales_date", { ascending: false })
      .limit(15)
      .returns<SalesRow[]>()
  ]);

  const selectedTotal = (sales ?? []).reduce((sum, s) => sum + s.sales_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Daily Sales Closing</h2>
          <p className="text-sm text-muted">Capture end-of-day sales entries with clear selected-date context.</p>
        </div>
        <form className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted">Selected date</label>
            <Input name="date" type="date" defaultValue={selectedDate} />
          </div>
          <Button type="submit" variant="outline">Load Date</Button>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <ActionForm action={addSale} keepFields={["sales_date"]} className="card grid gap-3 p-4 md:grid-cols-2">
          <input type="hidden" name="sales_date" value={selectedDate} />
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-muted">Sales entry for {selectedDate}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Sales amount</label>
            <Input name="sales_amount" type="number" step="0.01" placeholder="0.00" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Source</label>
            <Input name="source" placeholder="Dining, delivery, bar..." />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted">Notes</label>
            <Input name="notes" placeholder="Optional closing notes" />
          </div>
          <div className="md:col-span-2">
            <Button className="w-full md:w-auto">Add Sales Entry</Button>
          </div>
        </ActionForm>
        <div className="card space-y-2 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Selected day total</p>
          <p className="text-3xl font-semibold text-accent">{formatCurrency(selectedTotal)}</p>
          <p className="text-sm text-muted">{sales?.length ?? 0} entries captured for {selectedDate}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card overflow-hidden xl:col-span-2">
          <div className="border-b border-border p-4"><h3 className="font-medium">Sales entries on {selectedDate}</h3></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Notes</th></tr>
              </thead>
              <tbody>
                {sales?.length ? sales.map((s) => (
                  <tr key={s.id} className="border-t border-border/60 text-muted">
                    <td className="px-4 py-3">{s.sales_date}</td>
                    <td className="px-4 py-3 text-foreground">{formatCurrency(s.sales_amount)}</td>
                    <td className="px-4 py-3">{s.source ?? "General"}</td>
                    <td className="px-4 py-3">{s.notes ?? "-"}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No sales entries for this date.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 font-medium">Recent history</h3>
          <div className="space-y-2 text-sm text-muted">
            {recentSales?.map((entry) => (
              <p key={entry.id}>{entry.sales_date} • {formatCurrency(entry.sales_amount)} • {entry.source ?? "General"}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

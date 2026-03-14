import { addExpense } from "@/actions/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getCurrentRestaurantId } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

type ExpenseRow = {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  note: string | null;
  created_at: string;
};
type CategoryRow = { id: string; name: string };

function parseExpenseNote(rawNote: string | null) {
  if (!rawNote) return { itemName: "-", detailNote: "-" };
  if (rawNote.startsWith("Item: ")) {
    const [itemPart, ...noteParts] = rawNote.split(" | Note: ");
    return {
      itemName: itemPart.replace("Item: ", "").trim() || "-",
      detailNote: noteParts.join(" | Note: ").trim() || "-",
    };
  }
  return { itemName: rawNote, detailNote: "-" };
}

export default async function ExpensesPage({ searchParams }: { searchParams?: { date?: string } }) {
  const supabase = await createClient();
  const restaurantId = await getCurrentRestaurantId();
  const selectedDate = searchParams?.date ?? new Date().toISOString().slice(0, 10);

  const [{ data: expenses }, { data: categories }] = await Promise.all([
    supabase
      .from("daily_expenses")
      .select("id,expense_date,category,amount,note,created_at")
      .eq("restaurant_id", restaurantId)
      .eq("expense_date", selectedDate)
      .order("created_at", { ascending: false })
      .returns<ExpenseRow[]>(),
    supabase
      .from("inventory_categories")
      .select("id,name")
      .eq("restaurant_id", restaurantId)
      .eq("active", true)
      .order("sort_order")
      .returns<CategoryRow[]>(),
  ]);

  const totalExpenses = (expenses ?? []).reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Daily Expenses</h2>
          <p className="text-sm text-muted">Capture daily non-inventory cash expenses for clean cash result tracking.</p>
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
        <form action={async (formData) => {
          "use server";
          await addExpense(formData);
        }} className="card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3">
            <p className="text-xs uppercase tracking-wide text-muted">Quick expense entry</p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Item name</label>
            <Input name="item_name" placeholder="e.g. onions, cleaning spray" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Date</label>
            <Input name="expense_date" type="date" defaultValue={selectedDate} required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Category</label>
            <Select name="category" required defaultValue="">
              <option value="">Select category</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Amount</label>
            <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
          </div>
          <div className="xl:col-span-2">
            <label className="mb-1 block text-xs text-muted">Note</label>
            <Input name="note" placeholder="Optional note" />
          </div>
          <div className="flex items-end">
            <Button className="w-full">Save Expense</Button>
          </div>
        </form>

        <div className="card space-y-2 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Selected day summary</p>
          <p className="text-3xl font-semibold text-accent">{formatCurrency(totalExpenses)}</p>
          <p className="text-sm text-muted">{expenses?.length ?? 0} expense entries on {selectedDate}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-medium">Expenses on {selectedDate}</h3>
          <p className="text-sm text-muted">Total expenses: {formatCurrency(totalExpenses)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {expenses?.length ? expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-border/60 text-muted">
                  <td className="px-4 py-3 text-foreground">{parseExpenseNote(expense.note).itemName}</td>
                  <td className="px-4 py-3 text-foreground">{expense.category}</td>
                  <td className="px-4 py-3 text-foreground">{formatCurrency(expense.amount)}</td>
                  <td className="px-4 py-3">{expense.expense_date}</td>
                  <td className="px-4 py-3">{parseExpenseNote(expense.note).detailNote}</td>
                </tr>
              )) : <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No expenses recorded for this date.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

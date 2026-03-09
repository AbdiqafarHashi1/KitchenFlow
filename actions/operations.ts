"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getCurrentRestaurantId } from "@/lib/data";
import { calculateUsage } from "@/lib/usage";
import { requirePermission } from "@/lib/permissions";

const num = z.coerce.number().nonnegative();

export async function addAdvance(formData: FormData) {
  const schema = z.object({ staff_id: z.string().uuid(), advance_date: z.string(), amount: num, note: z.string().optional() });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  await requirePermission("staff_advances:create");
  const restaurant_id = await getCurrentRestaurantId();
  const { error } = await supabase.from("staff_advances").insert({ ...parsed.data, restaurant_id } as never);
  if (error) return { error: error.message };
  revalidatePath("/staff");
  revalidatePath(`/staff/${parsed.data.staff_id}`);
  revalidatePath("/dashboard");
  return { success: "Advance added" };
}

export async function addPurchase(formData: FormData) {
  const schema = z.object({ inventory_item_id: z.string().uuid(), supplier_name: z.string().optional(), quantity: num, unit_cost: num, purchase_date: z.string(), note: z.string().optional() });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  await requirePermission("purchases:create");
  const restaurant_id = await getCurrentRestaurantId();
  const total_cost = parsed.data.quantity * parsed.data.unit_cost;

  const { error } = await supabase.from("purchases").insert({ ...parsed.data, total_cost, restaurant_id } as never);
  if (error) return { error: error.message };

  await supabase.from("inventory_movements").insert({ restaurant_id, inventory_item_id: parsed.data.inventory_item_id, movement_type: "purchase", quantity: parsed.data.quantity, unit_cost: parsed.data.unit_cost, total_cost, note: parsed.data.note } as never);

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: "Purchase recorded" };
}

export async function addSale(formData: FormData) {
  const schema = z.object({ sales_date: z.string(), sales_amount: num, source: z.string().optional(), notes: z.string().optional() });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  await requirePermission("sales:create");
  const restaurant_id = await getCurrentRestaurantId();
  const { error } = await supabase.from("daily_sales").insert({ ...parsed.data, restaurant_id } as never);
  if (error) return { error: error.message };
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: "Sales entry added" };
}

export async function addUsage(formData: FormData) {
  const schema = z.object({
    usage_date: z.string(),
    inventory_item_id: z.string().uuid(),
    quantity_used: num,
    note: z.string().optional()
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const context = await requirePermission("usage:create");
  const restaurant_id = context.restaurantId;

  const { data: item, error: itemError } = await supabase
    .from("inventory_items")
    .select("average_unit_cost")
    .eq("restaurant_id", restaurant_id)
    .eq("id", parsed.data.inventory_item_id)
    .single();

  if (itemError || !item) return { error: itemError?.message ?? "Inventory item not found" };

  const usageTimestamp = `${parsed.data.usage_date}T12:00:00.000Z`;
  const total_cost = parsed.data.quantity_used * item.average_unit_cost;
  const noteWithActor = parsed.data.note
    ? `${parsed.data.note} (entered by ${context.userId})`
    : `entered by ${context.userId}`;

  const { error } = await supabase.from("inventory_movements").insert({
    restaurant_id,
    inventory_item_id: parsed.data.inventory_item_id,
    movement_type: "usage",
    quantity: parsed.data.quantity_used,
    unit_cost: item.average_unit_cost,
    total_cost,
    note: noteWithActor,
    created_at: usageTimestamp
  } as never);

  if (error) return { error: error.message };

  revalidatePath("/usage");
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${parsed.data.inventory_item_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: "Usage entry added" };
}

export async function addExpense(formData: FormData) {
  const schema = z.object({
    expense_date: z.string(),
    category: z.string().min(1),
    amount: num,
    note: z.string().optional()
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  await requirePermission("expenses:create");
  const restaurant_id = await getCurrentRestaurantId();

  const { error } = await supabase.from("daily_expenses").insert({ ...parsed.data, restaurant_id } as never);
  if (error) return { error: error.message };

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: "Expense added" };
}

export async function adjustInventory(formData: FormData) {
  const schema = z.object({ inventory_item_id: z.string().uuid(), quantity: z.coerce.number(), note: z.string().optional() });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  await requirePermission("inventory:adjust");
  const restaurant_id = await getCurrentRestaurantId();
  await supabase.from("inventory_movements").insert({ restaurant_id, inventory_item_id: parsed.data.inventory_item_id, movement_type: "adjustment", quantity: parsed.data.quantity, note: parsed.data.note } as never);

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${parsed.data.inventory_item_id}`);
  revalidatePath("/dashboard");
  return { success: "Inventory adjusted" };
}

export async function saveDailyStockCount(formData: FormData) {
  const schema = z.object({
    inventory_item_id: z.string().uuid(),
    count_date: z.string(),
    opening_quantity: num,
    purchases_quantity: num,
    closing_quantity: num,
    waste_quantity: num.default(0),
    average_unit_cost: num,
    note: z.string().optional()
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const available = parsed.data.opening_quantity + parsed.data.purchases_quantity;
  if (parsed.data.closing_quantity > available) {
    return { error: `Closing stock exceeds available stock (${available.toFixed(2)})` };
  }

  const usageCalc = calculateUsage({
    opening: parsed.data.opening_quantity,
    purchases: parsed.data.purchases_quantity,
    closing: parsed.data.closing_quantity,
    waste: parsed.data.waste_quantity,
    averageUnitCost: parsed.data.average_unit_cost
  });

  if (usageCalc.usage < 0) {
    return { error: "Calculated usage is negative. Check closing stock and waste values." };
  }

  const supabase = await createClient();
  const restaurant_id = await getCurrentRestaurantId();

  const { error: upsertError } = await supabase.from("daily_stock_counts").upsert(
    {
      restaurant_id,
      inventory_item_id: parsed.data.inventory_item_id,
      count_date: parsed.data.count_date,
      closing_quantity: parsed.data.closing_quantity,
      waste_quantity: parsed.data.waste_quantity,
      note: parsed.data.note
    },
    { onConflict: "restaurant_id,inventory_item_id,count_date" }
  );
  if (upsertError) return { error: upsertError.message };

  const { error: updateItemError } = await supabase
    .from("inventory_items")
    .update({ current_quantity: parsed.data.closing_quantity })
    .eq("id", parsed.data.inventory_item_id)
    .eq("restaurant_id", restaurant_id);
  if (updateItemError) return { error: updateItemError.message };

  await supabase.from("inventory_movements").insert({
    restaurant_id,
    inventory_item_id: parsed.data.inventory_item_id,
    movement_type: "usage",
    quantity: usageCalc.usage,
    unit_cost: parsed.data.average_unit_cost,
    total_cost: usageCalc.usageCost,
    note: `Auto from closing stock count (${parsed.data.count_date})`
  });

  if (parsed.data.waste_quantity > 0) {
    await supabase.from("inventory_movements").insert({
      restaurant_id,
      inventory_item_id: parsed.data.inventory_item_id,
      movement_type: "waste",
      quantity: parsed.data.waste_quantity,
      unit_cost: parsed.data.average_unit_cost,
      total_cost: parsed.data.waste_quantity * parsed.data.average_unit_cost,
      note: parsed.data.note || `Waste captured during closing stock count (${parsed.data.count_date})`
    });
  }

  revalidatePath("/usage");
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${parsed.data.inventory_item_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: "Closing stock saved" };
}

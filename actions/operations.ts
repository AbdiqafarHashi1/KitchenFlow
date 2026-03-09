"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getCurrentRestaurantId } from "@/lib/data";
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

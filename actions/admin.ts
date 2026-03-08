"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getCurrentRestaurantId } from "@/lib/data";
import { requirePermission } from "@/lib/permissions";

export async function addStaff(formData: FormData) {
  const parsed = z.object({ full_name: z.string().min(2), role: z.string().min(2), phone: z.string().optional(), salary_type: z.enum(["monthly", "weekly", "daily"]), base_salary: z.coerce.number().nonnegative(), start_date: z.string().optional(), notes: z.string().optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  await requirePermission("staff:manage");
  const restaurant_id = await getCurrentRestaurantId();
  const { error } = await supabase.from("staff").insert({ ...parsed.data, restaurant_id } as never);
  if (error) return { error: error.message };
  revalidatePath("/staff");
  return { success: "Staff added" };
}

export async function addInventoryItem(formData: FormData) {
  const parsed = z.object({ category_id: z.string().uuid().optional(), name: z.string().min(2), unit: z.string().min(1), current_quantity: z.coerce.number().nonnegative(), min_quantity: z.coerce.number().nonnegative(), average_unit_cost: z.coerce.number().nonnegative(), supplier_name: z.string().optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  await requirePermission("inventory:manage");
  const restaurant_id = await getCurrentRestaurantId();
  const { error } = await supabase.from("inventory_items").insert({ ...parsed.data, restaurant_id } as never);
  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return { success: "Inventory item added" };
}

export async function updateRestaurantSettings(formData: FormData) {
  const parsed = z.object({ name: z.string().min(2), phone: z.string().optional(), address: z.string().optional(), currency: z.string().min(3), timezone: z.string().optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  await requirePermission("settings:manage");
  const restaurantId = await getCurrentRestaurantId();
  const { error } = await supabase.from("restaurants").update({ name: parsed.data.name, phone: parsed.data.phone, address: parsed.data.address, currency: parsed.data.currency } as never).eq("id", restaurantId);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: "Settings updated" };
}

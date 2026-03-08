import { createClient } from "@/lib/supabase-server";

export type AppRole = "admin" | "data_entry";
export type AppPermission =
  | "dashboard:view"
  | "staff:view"
  | "staff:manage"
  | "staff_advances:create"
  | "inventory:view"
  | "inventory:manage"
  | "inventory:adjust"
  | "purchases:create"
  | "sales:create"
  | "reports:view"
  | "settings:manage";

const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  admin: [
    "dashboard:view",
    "staff:view",
    "staff:manage",
    "staff_advances:create",
    "inventory:view",
    "inventory:manage",
    "inventory:adjust",
    "purchases:create",
    "sales:create",
    "reports:view",
    "settings:manage"
  ],
  data_entry: ["dashboard:view", "staff:view", "staff_advances:create", "inventory:view", "purchases:create", "sales:create"]
};

export function normalizeRole(role?: string | null): AppRole {
  if (role === "data_entry") return "data_entry";
  return "admin";
}

export async function getCurrentUserContext() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("admin_profiles")
    .select("restaurant_id,role")
    .eq("id", userData.user.id)
    .single();

  if (error || !data?.restaurant_id) {
    throw new Error("Admin profile not linked to restaurant");
  }

  return {
    userId: userData.user.id,
    restaurantId: data.restaurant_id,
    role: normalizeRole(data.role)
  };
}

export function hasPermission(role: AppRole, permission: AppPermission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export async function requirePermission(permission: AppPermission) {
  const context = await getCurrentUserContext();
  if (!hasPermission(context.role, permission)) {
    throw new Error("Access restricted");
  }
  return context;
}

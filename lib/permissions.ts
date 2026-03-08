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
  | "usage:create"
  | "expenses:create"
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
    "usage:create",
    "expenses:create",
    "sales:create",
    "reports:view",
    "settings:manage"
  ],
  data_entry: [
    "dashboard:view",
    "staff:view",
    "staff_advances:create",
    "inventory:view",
    "purchases:create",
    "usage:create",
    "expenses:create",
    "sales:create"
  ]
};

export function normalizeRole(role?: string | null): AppRole {
  if (role === "data_entry") return "data_entry";
  return "admin";
}

type UserContextErrorCode =
  | "UNAUTHENTICATED"
  | "MISSING_ADMIN_PROFILE"
  | "MISSING_RESTAURANT_LINK"
  | "PROFILE_QUERY_ERROR"
  | "AUTH_ERROR";

export class UserContextError extends Error {
  constructor(
    public readonly code: UserContextErrorCode,
    message: string,
    public readonly causeDetail?: string
  ) {
    super(message);
    this.name = "UserContextError";
  }
}

function logUserContextFailure(code: UserContextErrorCode, details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[permissions:getCurrentUserContext]", code, details);
  }
}

export async function getCurrentUserContext() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    logUserContextFailure("AUTH_ERROR", { message: userError.message, status: userError.status });
    throw new UserContextError("AUTH_ERROR", "Unable to validate authenticated user", userError.message);
  }

  if (!userData.user) {
    logUserContextFailure("UNAUTHENTICATED", {});
    throw new UserContextError("UNAUTHENTICATED", "Unauthorized");
  }

  const { data, error } = await supabase
    .from("admin_profiles")
    .select("restaurant_id,role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) {
    logUserContextFailure("PROFILE_QUERY_ERROR", {
      userId: userData.user.id,
      code: error.code,
      message: error.message,
      details: error.details
    });
    throw new UserContextError("PROFILE_QUERY_ERROR", "Unable to load admin profile", error.message);
  }

  if (!data) {
    logUserContextFailure("MISSING_ADMIN_PROFILE", { userId: userData.user.id });
    throw new UserContextError("MISSING_ADMIN_PROFILE", "Admin profile not found for authenticated user");
  }

  if (!data.restaurant_id) {
    logUserContextFailure("MISSING_RESTAURANT_LINK", { userId: userData.user.id });
    throw new UserContextError("MISSING_RESTAURANT_LINK", "Admin profile is missing restaurant_id");
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

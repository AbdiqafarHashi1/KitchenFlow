import { getCurrentUserContext } from "@/lib/permissions";

export async function getCurrentRestaurantId() {
  const context = await getCurrentUserContext();
  return context.restaurantId;
}

export async function getCurrentUserRole() {
  const context = await getCurrentUserContext();
  return context.role;
}

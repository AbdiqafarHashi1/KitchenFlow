import { createClient } from "@/lib/supabase-server";

export async function getCurrentRestaurantId() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("admin_profiles")
    .select("restaurant_id")
    .eq("id", userData.user.id)
    .single();

  if (error || !data?.restaurant_id) {
    throw new Error("Admin profile not linked to restaurant");
  }

  return data.restaurant_id;
}

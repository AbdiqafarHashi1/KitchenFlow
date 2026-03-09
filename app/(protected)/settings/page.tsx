import { AccessRestricted } from "@/components/layout/access-restricted";
import { hasPermission } from "@/lib/permissions";
import { updateRestaurantSettings } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentRestaurantId, getCurrentUserRole } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole();
  if (!hasPermission(role, "settings:manage")) {
    return <AccessRestricted message="Settings are available to admin users only." />;
  }

  const restaurantId = await getCurrentRestaurantId();
  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("id", restaurantId).single();

  return (
    <form action={updateRestaurantSettings} className="card grid max-w-2xl gap-3 p-4">
      <h2 className="text-lg font-semibold">Restaurant Settings</h2>
      <Input name="name" defaultValue={restaurant?.name} placeholder="Restaurant name" required />
      <Input name="phone" defaultValue={restaurant?.phone ?? ""} placeholder="Phone" />
      <Input name="address" defaultValue={restaurant?.address ?? ""} placeholder="Address" />
      <Input name="currency" defaultValue={restaurant?.currency ?? "KES"} placeholder="Currency" required />
      <Input name="timezone" defaultValue="Africa/Nairobi" placeholder="Timezone" />
      <Button>Save settings</Button>
    </form>
  );
}

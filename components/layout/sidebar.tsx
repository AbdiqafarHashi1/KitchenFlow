import Link from "next/link";
import { Boxes, ChartNoAxesCombined, LayoutDashboard, ReceiptText, Settings, ShoppingBasket, Users } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff", label: "Staff & Payroll", icon: Users },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/purchases", label: "Purchases", icon: ShoppingBasket },
  { href: "/sales", label: "Sales", icon: ReceiptText },
  { href: "/reports", label: "Reports", icon: ChartNoAxesCombined },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  return (
    <aside className="w-full border-r border-border bg-[#0f0f14] p-4 md:w-64">
      <div className="mb-8 text-xl font-semibold text-accent">KitchenFlow</div>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-foreground">
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

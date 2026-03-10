import Link from "next/link";
import {
  Boxes,
  ChartNoAxesCombined,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShoppingBasket,
  Users,
  ClipboardCheck,
  HandCoins,
} from "lucide-react";
import type { AppRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type SidebarProps = {
  role: AppRole;
  className?: string;
  showTitle?: boolean;
  onNavigate?: () => void;
};

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "data_entry"] as AppRole[] },
  { href: "/staff", label: "Staff & Payroll", icon: Users, roles: ["admin", "data_entry"] as AppRole[] },
  { href: "/inventory", label: "Inventory", icon: Boxes, roles: ["admin", "data_entry"] as AppRole[] },
  { href: "/purchases", label: "Purchases", icon: ShoppingBasket, roles: ["admin", "data_entry"] as AppRole[] },
  { href: "/usage", label: "Closing Stock", icon: ClipboardCheck, roles: ["admin", "data_entry"] as AppRole[] },
  { href: "/expenses", label: "Expenses", icon: HandCoins, roles: ["admin", "data_entry"] as AppRole[] },
  { href: "/sales", label: "Sales", icon: ReceiptText, roles: ["admin", "data_entry"] as AppRole[] },
  { href: "/reports", label: "Reports", icon: ChartNoAxesCombined, roles: ["admin"] as AppRole[] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] as AppRole[] },
];

export function Sidebar({ role, className, showTitle = true, onNavigate }: SidebarProps) {
  return (
    <aside className={cn("w-full border-r border-border bg-[#0f0f14] p-4 md:w-64", className)}>
      {showTitle ? <div className="mb-8 text-xl font-semibold text-accent">KitchenFlow</div> : null}
      <nav className="space-y-1">
        {items
          .filter((item) => item.roles.includes(role))
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
      </nav>
    </aside>
  );
}

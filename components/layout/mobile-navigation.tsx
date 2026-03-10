"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import type { AppRole } from "@/lib/permissions";

type MobileNavigationProps = {
  role: AppRole;
  actions?: React.ReactNode;
};

export function MobileNavigation({ role, actions }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="mb-4 flex items-center justify-between border-b border-border bg-background py-3 md:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" aria-label="Open navigation menu" onClick={() => setIsOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-lg font-semibold text-accent">KitchenFlow</span>
        </div>
        {actions}
      </header>

      {isOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-[#0f0f14] p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-semibold text-accent">KitchenFlow</span>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" aria-label="Close navigation" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Sidebar role={role} showTitle={false} className="w-full border-none bg-transparent p-0" onNavigate={() => setIsOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}

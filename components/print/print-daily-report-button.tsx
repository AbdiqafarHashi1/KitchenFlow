"use client";

import { Button } from "@/components/ui/button";

export function PrintDailyReportButton() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      Print Daily Report
    </Button>
  );
}

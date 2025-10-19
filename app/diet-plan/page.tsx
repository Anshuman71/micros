"use client";

import { AppShell, usePreferences } from "@/components/app-shell";
import { DietPlanTab } from "@/components/diet-plan-tab";

function DietPlanPageContent() {
  const { preferences, openPreferences } = usePreferences();

  return (
    <DietPlanTab
      preferences={preferences}
      onOpenPreferences={openPreferences}
    />
  );
}

export default function DietPlan() {
  return (
    <AppShell>
      <DietPlanPageContent />
    </AppShell>
  );
}

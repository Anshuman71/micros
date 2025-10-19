"use client";

import { usePreferences } from "./app-shell";
import { DietPlanTab } from "./diet-plan-tab";

export function DietPlanClient({ chatId }: { chatId: string }) {
  const { preferences, openPreferences } = usePreferences();

  return (
    <DietPlanTab
      chatId={chatId}
      preferences={preferences}
      onOpenPreferences={openPreferences}
    />
  );
}

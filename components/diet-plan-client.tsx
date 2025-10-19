"use client";

import { usePreferences } from "./app-shell";
import { DietPlanTab } from "./diet-plan-tab";
import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";

export function DietPlanClient({ chatId }: { chatId: string }) {
  const { preferences, openPreferences } = usePreferences();
  const [storedChatId, setStoredChatId] = useLocalStorage<string | null>(
    "dietChatId",
    null
  );

  useEffect(() => {
    if (chatId && chatId !== storedChatId) {
      setStoredChatId(chatId);
    }
  }, [chatId, storedChatId, setStoredChatId]);

  return (
    <DietPlanTab
      chatId={chatId}
      preferences={preferences}
      onOpenPreferences={openPreferences}
    />
  );
}

"use client";

import type React from "react";
import Link from "next/link";

interface Tab {
  id: string;
  label: string;
  href: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  rightContent?: React.ReactNode;
}

const accentMap = {
  vitamins: "var(--accent-vitamins)",
  minerals: "var(--accent-minerals)",
  "diet-plan": "var(--accent-diet-plan)",
};

export function Tabs({ tabs, activeTab, rightContent }: TabsProps) {
  return (
    <div className="flex items-center justify-between border-b border-border">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`px-6 py-4 font-medium text-sm transition-all relative ${
              activeTab === tab.id
                ? `text-[${accentMap[tab.id]}]`
                : "text-foreground/60 hover:text-foreground/80"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full"
                style={{
                  backgroundColor: accentMap[tab.id as keyof typeof accentMap],
                }}
              />
            )}
          </Link>
        ))}
      </div>
      {rightContent && <div className="pr-6">{rightContent}</div>}
    </div>
  );
}

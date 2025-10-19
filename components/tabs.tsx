"use client"

import type React from "react"

import { useState } from "react"

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  defaultTab: string
  onTabChange: (tabId: string) => void
  rightContent?: React.ReactNode
}

const accentMap = {
  vitamins: "var(--accent-vitamins)",
  minerals: "var(--accent-minerals)",
  "diet-plan": "var(--accent-diet-plan)",
}

export function Tabs({ tabs, defaultTab, onTabChange, rightContent }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange(tabId)
  }

  return (
    <div className="flex items-center justify-between border-b border-border">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-6 py-4 font-medium text-sm transition-all relative ${
              activeTab === tab.id ? `text-[${accentMap[tab.id]}]` : "text-foreground/60 hover:text-foreground/80"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full"
                style={{ backgroundColor: accentMap[tab.id as keyof typeof accentMap] }}
              />
            )}
          </button>
        ))}
      </div>
      {rightContent && <div className="pr-6">{rightContent}</div>}
    </div>
  )
}

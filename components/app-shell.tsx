"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { Tabs } from "@/components/tabs";
import {
  PreferencesModal,
  type DietPreferences,
} from "@/components/preferences-modal";

interface PreferencesContextType {
  preferences: DietPreferences | null;
  openPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within AppShell");
  }
  return context;
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [dietPreferences, setDietPreferences] =
    useState<DietPreferences | null>(null);

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname === "/minerals") return "minerals";
    if (pathname === "/vitamins") return "vitamins";
    return "diet-plan";
  };

  const activeTab = getActiveTab();

  useEffect(() => {
    const savedPreferences = localStorage.getItem("dietPreferences");
    if (savedPreferences) {
      try {
        setDietPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    }
  }, []);

  // Handle scroll to minimize header with hysteresis to prevent flapping
  useEffect(() => {
    let scrolling = false;
    const handleScroll = () => {
      const scrollY = window.scrollY;

      // Only change state if we're clearly above or below thresholds
      if (scrollY && !scrolling) {
        setIsScrolled(true);
        scrolling = true;
      } else if (!scrollY && scrolling) {
        setIsScrolled(false);
        scrolling = false;
      }
    };

    // Set initial state
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSavePreferences = (preferences: DietPreferences) => {
    setDietPreferences(preferences);
    localStorage.setItem("dietPreferences", JSON.stringify(preferences));
  };

  const accentMap = {
    vitamins: "var(--accent-vitamins)",
    minerals: "var(--accent-minerals)",
    "diet-plan": "var(--accent-diet-plan)",
  };

  const preferencesValue = {
    preferences: dietPreferences,
    openPreferences: () => setIsPreferencesOpen(true),
  };

  return (
    <PreferencesContext.Provider value={preferencesValue}>
      <main
        className="min-h-screen bg-background"
        style={{
          backgroundColor: `color-mix(in srgb, ${
            accentMap[activeTab as keyof typeof accentMap]
          } 10%, transparent)`,
        }}
      >
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-50 transition-all duration-300">
          <div
            className="max-w-7xl mx-auto px-6 overflow-hidden transition-all duration-300"
            style={{
              maxHeight: isScrolled ? "0px" : "200px",
              paddingTop: isScrolled ? "0" : "2rem",
              paddingBottom: isScrolled ? "0" : "2rem",
              opacity: isScrolled ? 0 : 1,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-row justify-start items-start gap-3">
                <div className="min-w-10 w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">
                    μ
                  </span>
                </div>
                <div className="flex flex-col justify-start items-start">
                  <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                    Micronutrients & Minerals
                  </h1>
                  <p className="text-foreground/60 text-sm mt-1">
                    Discover essential vitamins and minerals your body needs to
                    thrive
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6">
            <Tabs
              tabs={[
                { id: "vitamins", label: "Vitamins", href: "/" },
                { id: "minerals", label: "Minerals", href: "/minerals" },
                { id: "diet-plan", label: "Diet Plan", href: "/diet-plan" },
              ]}
              activeTab={activeTab}
            />
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-9">{children}</div>

        {/* Footer */}
        <footer className="border-t border-border bg-card mt-16">
          <div className="max-w-7xl mx-auto px-6 py-8 text-center text-foreground/60">
            <p>
              Maintain a balanced diet rich in these essential micronutrients
              for optimal health
            </p>
          </div>
        </footer>

        <PreferencesModal
          isOpen={isPreferencesOpen}
          onClose={() => setIsPreferencesOpen(false)}
          onSave={handleSavePreferences}
          initialPreferences={dietPreferences || undefined}
        />
      </main>
    </PreferencesContext.Provider>
  );
}

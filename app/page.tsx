"use client";

import { useEffect, useState } from "react";
import { CategorySection } from "@/components/category-section";
import { Tabs } from "@/components/tabs";
import {
  PreferencesModal,
  type DietPreferences,
} from "@/components/preferences-modal";
import { DietPlanTab } from "@/components/diet-plan-tab";

interface Nutrient {
  name: string;
  category: string;
  unit: string;
  recommended_intake: Record<string, any>;
  found_in: string[];
  deficiency_can_cause: string;
  deficiency_symptoms: string[];
  absorption_tips: string;
}

export default function Home() {
  const [nutrients, setNutrients] = useState<Nutrient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("vitamins");
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [dietPreferences, setDietPreferences] =
    useState<DietPreferences | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/micronutrients.json");
        const jsonData = await response.json();
        setNutrients(jsonData);
      } catch (error) {
        console.error("Error loading micronutrients data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const savedPreferences = localStorage.getItem("dietPreferences");
    if (savedPreferences) {
      try {
        setDietPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    }
  }, []);

  const handleSavePreferences = (preferences: DietPreferences) => {
    setDietPreferences(preferences);
    localStorage.setItem("dietPreferences", JSON.stringify(preferences));
  };

  const vitamins = nutrients.filter(
    (n) =>
      n.category === "vitamin" ||
      n.category === "vitamin-like / essential nutrient"
  );
  const minerals = nutrients.filter((n) => n.category === "mineral");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="mt-4 text-foreground/60">Loading micronutrients...</p>
        </div>
      </div>
    );
  }

  if (nutrients.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/60">Failed to load data</p>
      </div>
    );
  }

  const accentMap = {
    vitamins: "var(--accent-vitamins)",
    minerals: "var(--accent-minerals)",
    "diet-plan": "var(--accent-diet-plan)",
  };

  return (
    <main
      className="min-h-screen bg-background"
      style={{
        backgroundColor: `color-mix(in srgb, ${
          accentMap[activeTab as keyof typeof accentMap]
        } 10%, transparent)`,
      }}
    >
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  μ
                </span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">
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
              { id: "vitamins", label: "Vitamins" },
              { id: "minerals", label: "Minerals" },
              { id: "diet-plan", label: "Diet Plan" },
            ]}
            defaultTab="vitamins"
            onTabChange={setActiveTab}
          />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-9">
        {activeTab === "vitamins" && vitamins.length > 0 && (
          <CategorySection
            title="Vitamins"
            description="Organic compounds essential for various bodily functions including immunity, energy production, and cellular repair."
            nutrients={vitamins}
            accentColor={accentMap["vitamins"]}
          />
        )}

        {activeTab === "minerals" && minerals.length > 0 && (
          <CategorySection
            title="Minerals"
            description="Inorganic elements crucial for bone health, muscle function, nerve transmission, and maintaining proper fluid balance."
            nutrients={minerals}
            accentColor={accentMap["minerals"]}
          />
        )}

        {activeTab === "diet-plan" && (
          <DietPlanTab
            preferences={dietPreferences}
            onOpenPreferences={() => setIsPreferencesOpen(true)}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-foreground/60">
          <p>
            Maintain a balanced diet rich in these essential micronutrients for
            optimal health
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
  );
}

"use client";

import { useEffect, useState } from "react";
import { CategorySection } from "@/components/category-section";

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

export default function Minerals() {
  const [nutrients, setNutrients] = useState<Nutrient[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const minerals = nutrients.filter((n) => n.category === "mineral");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="mt-4 text-foreground/60">Loading micronutrients...</p>
        </div>
      </div>
    );
  }

  if (nutrients.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-foreground/60">Failed to load data</p>
      </div>
    );
  }

  return (
    <CategorySection
      title="Minerals"
      description="Inorganic elements crucial for bone health, muscle function, nerve transmission, and maintaining proper fluid balance."
      nutrients={minerals}
    />
  );
}

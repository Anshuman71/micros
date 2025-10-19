import { MicronutrientCard } from "./micronutrient-card"

interface Nutrient {
  name: string
  category: string
  unit: string
  recommended_intake: Record<string, any>
  found_in: string[]
  deficiency_can_cause: string
  deficiency_symptoms: string[]
  absorption_tips: string
}

interface CategorySectionProps {
  title: string
  description: string
  nutrients: Nutrient[]
  accentColor: "vitamins" | "minerals"
}

export function CategorySection({ title, description, nutrients, accentColor }: CategorySectionProps) {


  return (
    <section className={"mb-16"}>
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-foreground/60 max-w-2xl">{description}</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nutrients.map((nutrient) => (
          <MicronutrientCard
            key={nutrient.name}
            name={nutrient.name}
            unit={nutrient.unit}
            recommendedIntake={nutrient.recommended_intake}
            foundIn={nutrient.found_in}
            deficiencyCan={nutrient.deficiency_can_cause}
            deficiencySymptoms={nutrient.deficiency_symptoms}
            absorptionTips={nutrient.absorption_tips}
            category={nutrient.category}
          />
        ))}
      </div>
    </section>
  )
}

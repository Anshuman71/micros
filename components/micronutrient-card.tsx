"use client"

interface MicronutrientCardProps {
  name: string
  unit: string
  recommendedIntake: Record<string, any>
  foundIn: string[]
  deficiencyCan: string
  deficiencySymptoms: string[]
  absorptionTips: string
  category: string
}

export function MicronutrientCard({
  name,
  unit,
  recommendedIntake,
  foundIn,
  deficiencyCan,
  deficiencySymptoms,
  absorptionTips,
  category,
}: MicronutrientCardProps) {
  const getRecommendedIntakeText = () => {
    const values = Object.values(recommendedIntake).flat()
    const uniqueValues = Array.from(new Set(values.map((v) => String(v))))
    return uniqueValues.slice(0, 2).join(" - ")
  }

  const getFoodCategory = (food: string): "fruit" | "vegetable" | "meat" | "other" => {
    const lowerFood = food.toLowerCase()

    // Fruits
    if (
      ["mango", "banana", "citrus", "guava", "amla", "strawberries", "orange juice", "avocado"].some((f) =>
        lowerFood.includes(f),
      )
    ) {
      return "fruit"
    }

    // Vegetables & Leafy Greens
    if (
      [
        "spinach",
        "kale",
        "broccoli",
        "leafy greens",
        "bell peppers",
        "carrots",
        "sweet potato",
        "mushrooms",
        "beets",
        "leafy vegetables",
      ].some((f) => lowerFood.includes(f))
    ) {
      return "vegetable"
    }

    // Meat & Fish
    if (
      ["meat", "fish", "liver", "pork", "poultry", "beef", "shellfish", "seafood", "fatty fish", "red meat"].some((f) =>
        lowerFood.includes(f),
      )
    ) {
      return "meat"
    }

    return "other"
  }

  const getBadgeStyle = (food: string) => {
    const category = getFoodCategory(food)
    const baseStyle = "inline-block text-xs px-3 py-1 rounded-full font-medium"

    switch (category) {
      case "fruit":
        return `${baseStyle} bg-[color:var(--badge-fruit-bg)] text-[color:var(--badge-fruit-fg)]`
      case "vegetable":
        return `${baseStyle} bg-[color:var(--badge-vegetable-bg)] text-[color:var(--badge-vegetable-fg)]`
      case "meat":
        return `${baseStyle} bg-[color:var(--badge-meat-bg)] text-[color:var(--badge-meat-fg)]`
      default:
        return `${baseStyle} bg-[color:var(--badge-background)] text-[color:var(--badge-foreground)]`
    }
  }

  const capitalizeFood = (food: string) => {
    return food
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-primary/20 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/40 dark:border-primary/30 dark:hover:border-primary/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:from-primary/10" />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">{name}</h3>
             <p className="text-sm font-semibold text-foreground">
            {getRecommendedIntakeText()} <span className="text-xs font-medium text-primary">{unit}</span>
          </p>
        </div>


        {/* Found In Section */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-foreground/70 mb-2">Found in:</h4>
          <div className="flex flex-wrap gap-2">
            {foundIn.map((source) => (
              <span key={source} className={getBadgeStyle(source)}>
                {capitalizeFood(source)}
              </span>
            ))}
          </div>
        </div>

        {/* Deficiency Info */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-foreground/70 mb-2">Deficiency can cause:</h4>
          <p className="text-sm text-foreground/60 mb-3">{deficiencyCan}</p>

          <h4 className="text-sm font-semibold text-foreground/70 mb-2">Symptoms:</h4>
          <ul className="space-y-1">
            {deficiencySymptoms.map((symptom) => (
              <li key={symptom} className="text-sm text-foreground/60 flex items-start">
                <span className="text-[color:var(--bullet-color)] mr-2 font-bold">•</span>
                {symptom}
              </li>
            ))}
          </ul>
        </div>

        {/* Absorption Tips */}
        <div className="pt-3 border-t border-border/50">
          <p className="text-xs text-foreground/50 italic">{absorptionTips}</p>
        </div>
      </div>
    </div>
  )
}

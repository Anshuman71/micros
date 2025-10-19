import fs from "fs";
import path from "path";

interface Nutrient {
  name: string;
  category: string;
  unit: string;
  recommended_intake: Record<
    string,
    number | { male: number | string; female: number | string } | string
  >;
  found_in: string[];
}

function mapAgeGroupToKey(ageGroup: string): string {
  const mapping: Record<string, string> = {
    "4 to 8": "children_4_8",
    "9 to 13": "children_9_13",
    "14 to 50": "adult_19_50",
    "51 and above": "adult_51_plus",
  };
  return mapping[ageGroup] || "adult_19_50";
}

function getDailyRequirements(
  age: string,
  gender: string
): Record<string, { value: string; unit: string }> {
  try {
    const filePath = path.join(process.cwd(), "public", "micronutrients.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const nutrients: Nutrient[] = JSON.parse(fileContents);

    const ageKey = mapAgeGroupToKey(age);
    const requirements: Record<string, { value: string; unit: string }> = {};

    for (const nutrient of nutrients) {
      const intake = nutrient.recommended_intake[ageKey];

      if (intake) {
        let value: string;

        if (typeof intake === "number") {
          value = intake.toString();
        } else if (typeof intake === "string") {
          value = intake;
        } else if (typeof intake === "object" && intake !== null) {
          const genderKey = gender.toLowerCase() as "male" | "female";
          const genderValue = intake[genderKey];
          value =
            typeof genderValue === "string"
              ? genderValue
              : genderValue?.toString() || "N/A";
        } else {
          value = "N/A";
        }

        requirements[nutrient.name] = {
          value,
          unit: nutrient.unit,
        };
      }
    }

    return requirements;
  } catch (error) {
    console.error("Error reading micronutrients data:", error);
    return {};
  }
}

const SYSTEM_PROMPT = `
You are a nutrition planning assistant focused on creating practical, food-first meal recommendations.

Your task: Suggest 10-12 common food items (with specific serving sizes) that collectively help meet the user's daily micronutrient requirements.

CRITICAL: You MUST format your response using Markdown with the following structure:

## Recommended Foods

Present foods in a well-formatted Markdown table with these columns:

| Food Item | Serving Size | Key Micronutrients (% Daily Value) |
|-----------|--------------|-------------------------------------|
| Example   | 100g         | Vitamin C (45%), Iron (20%), Calcium (15%) |

Guidelines for the table:
- List 10-12 nutrient-dense foods
- Use practical serving sizes (e.g., "100g", "2 tablespoons", "1 cup")
- Show TOP 3 micronutrients each food provides with percentage of daily value
- Choose foods that are:
  * Easy to find and affordable
  * Match the user's dietary restrictions
  * Appropriate for their location/region
  * Rich in multiple micronutrients

## Nutrient Coverage Summary

After the food table, provide a summary table showing total coverage:

| Micronutrient | Total Coverage | Status |
|---------------|----------------|--------|
| Example       | 85%            | Good   |

## Quick Tips

Provide 3-4 bullet points on how to incorporate these foods:
- Tip 1
- Tip 2
- Tip 3

Guidelines:
- Prioritize whole foods over supplements
- Respect all dietary restrictions
- If a nutrient is difficult to meet with food alone, mention it
- Keep language simple, concise, and actionable
- No medical diagnosis; encourage professional advice for special conditions

Tone: Friendly, practical, evidence-based.
`;

export function getSystemPrompt(userPreferences: {
  dietOptions: string[];
  age: string;
  gender: string;
  requestHints: {
    longitude: number;
    latitude: number;
    city: string;
    country: string;
  };
}) {
  const { dietOptions, age, gender, requestHints } = userPreferences;

  // Get daily requirements from micronutrients data
  const dailyRequirements = getDailyRequirements(age, gender);

  // Format requirements for the prompt
  const requirementsText = Object.entries(dailyRequirements)
    .map(([nutrient, data]) => `  - ${nutrient}: ${data.value} ${data.unit}`)
    .join("\n");

  return `${SYSTEM_PROMPT}

User Profile:
- Age Group: ${age}
- Gender: ${gender}
- Dietary Preferences: ${dietOptions.join(", ")}
- Location: ${requestHints.city}, ${requestHints.country}

Daily Micronutrient Requirements:
${requirementsText}

Task: Recommend 10-12 nutrient-dense foods (with serving sizes) that are:
1. Commonly available in ${requestHints.country}
2. Compatible with: ${dietOptions.join(", ")}
3. Help meet the above daily requirements

For each food, show the serving size and percentage contribution to the TOP micronutrients it provides.`;
}

import { DietPlanClient } from "@/components/diet-plan-client";

export default async function DietPlan({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  return <DietPlanClient chatId={chatId} />;
}

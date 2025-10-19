import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { Spinner } from "@/components/ui/spinner";
import { DietPlanClient } from "@/components/diet-plan-client";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <Spinner className="inline-block w-12 h-12" />
        <p className="mt-4 text-foreground/60">Loading diet plan...</p>
      </div>
    </div>
  );
}

export default async function DietPlan({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  return (
    <AppShell>
      <Suspense fallback={<LoadingFallback />}>
        <DietPlanClient chatId={chatId} />
      </Suspense>
    </AppShell>
  );
}

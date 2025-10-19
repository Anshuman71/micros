import { Spinner } from "@/components/ui/spinner";

export default function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-16 min-h-screen">
      <div className="text-center">
        <Spinner className="inline-block w-12 h-12" />
        <p className="mt-4 text-foreground/60">Loading diet plan...</p>
      </div>
    </div>
  );
}

import { customAlphabet } from "nanoid";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function DietPlanPage() {
  const chatId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10)();
  return redirect(`/diet-plan/${chatId}`);
}

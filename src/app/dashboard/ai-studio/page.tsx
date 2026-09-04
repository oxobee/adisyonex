import { redirect } from "next/navigation";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getOrCreateWallet, listTransactions } from "@/services/ai/ai-credit.service";
import { listAiTasks } from "@/services/ai/ai-studio.service";
import { AiStudioView } from "@/components/ai/ai-studio-view";

export default async function AiStudioPage() {
  const ctx = await getManagerContextOrNull();
  const staffCtx = await getStaffContextOrNull();
  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;
  if (!restaurantId) {
    redirect("/login");
  }

  const [wallet, transactions, tasks] = await Promise.all([
    getOrCreateWallet(restaurantId),
    listTransactions(restaurantId, 10),
    listAiTasks(restaurantId, 10),
  ]);

  return (
    <AiStudioView
      wallet={wallet}
      transactions={transactions}
      tasks={tasks}
    />
  );
}

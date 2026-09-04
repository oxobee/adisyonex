import { redirect } from "next/navigation";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getOrCreateWallet, listTransactions } from "@/services/ai/ai-credit.service";
import { listAiTasks } from "@/services/ai/ai-studio.service";
import { AiHistoryView } from "@/components/ai/ai-history-view";

export default async function AiHistoryPage() {
  const ctx = await getManagerContextOrNull();
  const staffCtx = await getStaffContextOrNull();
  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;
  if (!restaurantId) {
    redirect("/login");
  }

  const [wallet, transactions, tasks] = await Promise.all([
    getOrCreateWallet(restaurantId),
    listTransactions(restaurantId, 50),
    listAiTasks(restaurantId, 50),
  ]);

  return (
    <AiHistoryView
      wallet={wallet}
      transactions={transactions}
      tasks={tasks}
    />
  );
}

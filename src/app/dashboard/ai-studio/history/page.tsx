import { redirect } from "next/navigation";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getOrCreateWallet, listTransactions } from "@/services/ai/ai-credit.service";
import { listAiTasks } from "@/services/ai/ai-studio.service";
import { AiHistoryView } from "@/components/ai/ai-history-view";

export default async function AiHistoryPage() {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    redirect("/login");
  }

  const [wallet, transactions, tasks] = await Promise.all([
    getOrCreateWallet(ctx.restaurantId),
    listTransactions(ctx.restaurantId, 50),
    listAiTasks(ctx.restaurantId, 50),
  ]);

  return (
    <AiHistoryView
      wallet={wallet}
      transactions={transactions}
      tasks={tasks}
    />
  );
}

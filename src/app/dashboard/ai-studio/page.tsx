import { redirect } from "next/navigation";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getOrCreateWallet, listTransactions } from "@/services/ai/ai-credit.service";
import { listAiTasks } from "@/services/ai/ai-studio.service";
import { AiStudioView } from "@/components/ai/ai-studio-view";

export default async function AiStudioPage() {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    redirect("/login");
  }

  const [wallet, transactions, tasks] = await Promise.all([
    getOrCreateWallet(ctx.restaurantId),
    listTransactions(ctx.restaurantId, 10),
    listAiTasks(ctx.restaurantId, 10),
  ]);

  return (
    <AiStudioView
      wallet={wallet}
      transactions={transactions}
      tasks={tasks}
    />
  );
}

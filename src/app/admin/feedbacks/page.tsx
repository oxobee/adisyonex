import { requireSuperAdminPage } from "@/lib/admin-auth";
import { serializeForClient } from "@/lib/utils";
import { listFeedbacksForAdminAction } from "@/actions/feedback.actions";
import { AdminFeedbackView } from "@/components/admin/admin-feedback-view";

export const dynamic = "force-dynamic";

export default async function AdminFeedbacksPage() {
  await requireSuperAdminPage();

  const res = await listFeedbacksForAdminAction().catch(() => ({
    success: true as const,
    data: [],
  }));

  const initialFeedbacks = res.success && res.data ? res.data : [];

  return (
    <div className="flex flex-col gap-6">
      <AdminFeedbackView initialFeedbacks={serializeForClient(initialFeedbacks)} />
    </div>
  );
}

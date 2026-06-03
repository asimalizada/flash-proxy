import { PlanDetailScreen } from "@/components/plans/plan-detail-screen";

type PlanDetailPageProps = {
  params: Promise<{
    planId: string;
  }>;
};

export default async function PlanDetailPage({
  params,
}: PlanDetailPageProps) {
  const { planId } = await params;

  return <PlanDetailScreen planId={planId} />;
}

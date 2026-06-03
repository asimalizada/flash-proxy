import { PlansScreen } from "@/components/plans/plans-screen";

type PlansPageProps = {
  searchParams?: Promise<{
    created?: string;
  }>;
};

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const params = await searchParams;

  return <PlansScreen createdPlanId={params?.created} />;
}

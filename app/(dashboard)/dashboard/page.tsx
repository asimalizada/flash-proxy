import { redirect } from "next/navigation";

import { OverviewPage } from "@/components/dashboard/overview-page";
import { getCurrentSession } from "@/lib/auth/session";
import {
  DashboardSummaryError,
  getDashboardSummary,
} from "@/lib/dashboard/summary";

async function loadSummary() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  try {
    return await getDashboardSummary(session, undefined, "critical");
  } catch (error) {
    if (error instanceof DashboardSummaryError && error.status === 401) {
      redirect("/login");
    }

    throw error;
  }
}

export default async function DashboardPage() {
  const summary = await loadSummary();

  return <OverviewPage summary={summary} />;
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { BalanceScreen } from "@/components/balance/balance-screen";
import { getRequestContext } from "@/lib/audit/context";
import {
  BalanceError,
  getBalance,
  listBalanceTransactions,
} from "@/lib/balance/service";
import { requireSession, SessionError } from "@/lib/auth/session";
import { listBalanceTransactionsQuerySchema } from "@/lib/validation/balance";

type BalancePageProps = {
  searchParams?: Promise<{
    page?: string;
    type?: string;
  }>;
};

export default async function BalancePage({ searchParams }: BalancePageProps) {
  const params = await searchParams;
  const parsed = listBalanceTransactionsQuerySchema.safeParse({
    page: params?.page,
    type: params?.type,
  });
  const filters = parsed.success
    ? parsed.data
    : listBalanceTransactionsQuerySchema.parse({});
  const { balance, transactions } = await loadBalanceData(filters);

  return (
    <BalanceScreen
      balance={balance}
      filters={filters}
      transactions={transactions}
    />
  );
}

async function loadBalanceData(
  filters: ReturnType<typeof listBalanceTransactionsQuerySchema.parse>
) {
  try {
    const session = await requireSession();
    const requestHeaders = await headers();
    const context = getRequestContext(
      new Request("https://dashboard.local", {
        headers: requestHeaders,
      })
    );
    const [balance, transactions] = await Promise.all([
      getBalance(session, undefined, context),
      listBalanceTransactions(session, filters, undefined, context),
    ]);

    return { balance, transactions };
  } catch (error) {
    if (
      error instanceof SessionError ||
      (error instanceof BalanceError && error.status === 401)
    ) {
      redirect("/login");
    }

    throw error;
  }
}

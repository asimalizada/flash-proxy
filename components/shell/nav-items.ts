import {
  Activity,
  ChartNoAxesCombined,
  CreditCard,
  LayoutDashboard,
  Package,
  Plus,
  ScrollText,
} from "lucide-react";

export const dashboardNavItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Buy",
    href: "/buy",
    icon: Plus,
  },
  {
    label: "Plans",
    href: "/plans",
    icon: Package,
  },
  {
    label: "Usage",
    href: "/usage",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Balance",
    href: "/balance",
    icon: CreditCard,
  },
  {
    label: "Audit",
    href: "/audit",
    icon: ScrollText,
  },
] as const;

export const dashboardQuickStats = [
  {
    label: "Session",
    value: "Active",
    icon: Activity,
  },
] as const;

import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Box,
  CreditCard,
  PackageCheck,
  Truck,
  Users,
} from "lucide-react";

export default function DashboardOverviewComponent({
  totalProducts = 0,
  totalOrders = 0,
  pendingShipping = 0,
  registeredUsers = 0,
  loading = false,
}) {
  const cards = [
    {
      title: "Catalog",
      value: totalProducts,
      note: "Published products ready to sell",
      icon: Box,
      link: "/products",
      tone: "bg-[linear-gradient(135deg,#fff1e5,#fffaf5)] text-gray-950",
    },
    {
      title: "Orders",
      value: totalOrders,
      note: "Tracked transactions across the store",
      icon: PackageCheck,
      link: "/orders",
      tone: "bg-white text-gray-950",
    },
    {
      title: "Shipping Queue",
      value: pendingShipping,
      note: "Orders waiting to move forward",
      icon: Truck,
      link: "/shipping",
      tone: "bg-[#1f2937] text-white",
    },
    {
      title: "Customers",
      value: registeredUsers,
      note: "Registered accounts in the system",
      icon: Users,
      link: "/users",
      tone: "bg-[linear-gradient(135deg,#f97316,#ea580c)] text-white",
    },
  ];

  const quickActions = [
    {
      label: "Create product",
      description: "Add a new catalog item with pricing and media.",
      href: "/products/new",
      icon: Box,
    },
    {
      label: "Review orders",
      description: "Check incoming purchases and order statuses.",
      href: "/orders",
      icon: PackageCheck,
    },
    {
      label: "Manage payments",
      description: "Update manual payment settings and channels.",
      href: "/manual-payment-accounts",
      icon: CreditCard,
    },
    {
      label: "Website content",
      description: "Keep banners, FAQs, and policy pages current.",
      href: "/website-content",
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
      <section className="rounded-[30px] border border-[#ece4db] bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
              Performance Snapshot
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-950">Core business metrics</h2>
            <p className="mt-2 text-sm text-gray-600">
              The signals your team needs most, without digging through each admin section.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff6ef] px-4 py-2 text-sm font-medium text-[#c2410c]">
            <BarChart3 size={16} />
            Operational overview
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {cards.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.link}
                className={`rounded-[26px] border border-white/60 p-5 shadow-sm transition hover:-translate-y-0.5 ${item.tone}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium opacity-80">{item.title}</div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/5">
                    <Icon size={18} />
                  </div>
                </div>
                <div className="mt-5 text-[1.9rem] font-semibold tracking-tight">
                  {loading ? "..." : item.value}
                </div>
                <div className="mt-1 text-sm opacity-75">{item.note}</div>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                  Open section
                  <ArrowRight size={15} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-[30px] border border-[#ece4db] bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
          Quick Actions
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-950">Move the store forward</h2>
        <p className="mt-2 text-sm text-gray-600">
          Jump into the admin tasks that usually matter first during daily operations.
        </p>

        <div className="mt-6 space-y-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.href}
                className="flex items-center justify-between gap-4 rounded-[22px] border border-gray-100 bg-[#fcfbf8] p-4 transition hover:border-[#f3c9a7] hover:bg-white"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff4ec] text-[#ea580c]">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-950">{action.label}</p>
                    <p className="mt-1 text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
                <ArrowRight className="shrink-0 text-gray-400" size={18} />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

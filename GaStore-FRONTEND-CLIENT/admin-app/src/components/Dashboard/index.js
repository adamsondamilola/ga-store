import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowRight,
  Box,
  PackageCheck,
  RefreshCw,
  Truck,
  Users,
} from "lucide-react";
import DashboardOverviewComponent from "./overview";
import RecentOrdersComponent from "./recentOrders";
import requestHandler from "../../utils/requestHandler";
import endpointsPath from "../../constants/EndpointsPath";

export default function DashboardComponent() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingShipping: 0,
    registeredUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showToast = false) => {
    setRefreshing(true);
    setLoading((prev) => (showToast ? prev : true));

    try {
      const [products, users, orders, pendingShipping] = await Promise.all([
        requestHandler.get(`${endpointsPath.product}`, true),
        requestHandler.get(`${endpointsPath.user}`, true),
        requestHandler.get(`${endpointsPath.order}?pageSize=10&pageNumber=1`, true),
        requestHandler.get(`${endpointsPath.shipping}?status=Pending`, true),
      ]);

      setStats({
        totalProducts: products?.statusCode === 200 ? products?.result?.totalRecords || 0 : 0,
        registeredUsers: users?.statusCode === 200 ? users?.result?.totalRecords || 0 : 0,
        totalOrders: orders?.statusCode === 200 ? orders?.result?.totalRecords || 0 : 0,
        pendingShipping:
          pendingShipping?.statusCode === 200 ? pendingShipping?.result?.totalRecords || 0 : 0,
      });

      if (showToast) {
        toast.success("Dashboard refreshed");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const heroHighlights = useMemo(
    () => [
      {
        label: "Products",
        value: stats.totalProducts,
        icon: Box,
      },
      {
        label: "Orders",
        value: stats.totalOrders,
        icon: PackageCheck,
      },
      {
        label: "Pending shipping",
        value: stats.pendingShipping,
        icon: Truck,
      },
      {
        label: "Users",
        value: stats.registeredUsers,
        icon: Users,
      },
    ],
    [stats]
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-[#f0dacc] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(255,245,236,0.95)_42%,_rgba(255,232,214,0.92)_100%)] p-6 shadow-[0_20px_70px_rgba(240,108,35,0.10)] md:p-7">
        <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-[#fb923c]/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-[#fdba74]/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c2410c]">
              Admin Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 md:text-[2.4rem]">
              Store operations at a glance
            </h1>
            <p className="mt-2 text-sm text-gray-600 md:text-base">
              Review catalog health, order volume, shipping workload, and account growth from one
              place.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                Review orders
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Manage catalog
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchStats(true)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
            Refresh
          </button>
        </div>

        <div className="relative z-10 mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {heroHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-[26px] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-600">{item.label}</div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff4ec] text-[#ea580c]">
                    <Icon size={18} />
                  </div>
                </div>
                <div className="mt-5 text-[1.9rem] font-semibold tracking-tight text-gray-950">
                  {loading ? "..." : item.value}
                </div>
                <div className="mt-1 text-sm text-gray-500">Live operational count</div>
              </div>
            );
          })}
        </div>
      </section>

      <DashboardOverviewComponent
        totalProducts={stats.totalProducts}
        totalOrders={stats.totalOrders}
        registeredUsers={stats.registeredUsers}
        pendingShipping={stats.pendingShipping}
        loading={loading}
      />

      <RecentOrdersComponent />
    </div>
  );
}

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
import PageHeader from "../../components/PageHeader";

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
  <div className="space-y-8">
    <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm md:p-8">
      <PageHeader
  title="Store Operations"
  subtitle="Monitor products, orders, pending shipping, and registered users from one clean dashboard."
  rightContent={
    <button
      onClick={() => fetchStats(true)}
      className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-white hover:bg-black"
    >
      <RefreshCw size={16} />
      Refresh
    </button>
  }
/>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {heroHighlights.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    {item.label}
                  </p>

                  <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-950">
                    {loading ? "..." : item.value.toLocaleString()}
                  </h2>
                </div>

                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600">
                  <Icon size={22} />
                </div>
              </div>

              <p className="mt-4 text-xs font-medium text-gray-400">
                Live operational count
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/orders"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
        >
          Review orders
          <ArrowRight size={16} />
        </Link>

        <Link
          to="/products"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
        >
          Manage catalog
        </Link>
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

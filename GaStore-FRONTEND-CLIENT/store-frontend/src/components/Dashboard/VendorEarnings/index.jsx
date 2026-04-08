"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiCalendar, FiCheckCircle, FiClock, FiDollarSign, FiRefreshCw } from "react-icons/fi";
import requestHandler from "@/utils/requestHandler";
import endpointsPath from "@/constants/EndpointsPath";
import { DashboardPageShell, DashboardPanel, DashboardStatCard } from "../PageShell";
import PaginationAlt from "@/components/PaginationAlt";

const pageSize = 10;

const formatMoney = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

export default function VendorEarnings() {
  const [earnings, setEarnings] = useState([]);
  const [overview, setOverview] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });

  const fetchData = async (targetPage = page, activeFilters = filters) => {
    setLoading(true);
    setRefreshing(true);
    try {
      const params = new URLSearchParams({
        pageNumber: String(targetPage),
        pageSize: String(pageSize),
        ...(activeFilters.status && { status: activeFilters.status }),
        ...(activeFilters.startDate && { startDate: activeFilters.startDate }),
        ...(activeFilters.endDate && { endDate: activeFilters.endDate }),
      });

      const [earningsResp, overviewResp] = await Promise.all([
        requestHandler.get(`${endpointsPath.vendorEarnings}/mine?${params.toString()}`, true),
        requestHandler.get(
          `${endpointsPath.vendorEarnings}/mine/overview?${new URLSearchParams({
            ...(activeFilters.startDate && { startDate: activeFilters.startDate }),
            ...(activeFilters.endDate && { endDate: activeFilters.endDate }),
          }).toString()}`,
          true
        ),
      ]);

      if (earningsResp.statusCode === 200) {
        setEarnings(earningsResp.result?.data || []);
        setTotalPages(earningsResp.result?.totalPages || 1);
        setTotalRecords(earningsResp.result?.totalRecords || 0);
      } else {
        toast.error(earningsResp.result?.message || "Unable to load earnings");
      }

      if (overviewResp.statusCode === 200) {
        setOverview(overviewResp.result?.data || null);
      }
    } catch (error) {
      console.error("vendor earnings fetch failed", error);
      toast.error("Unable to load earnings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(page, filters);
  }, [page]);

  const applyFilters = () => {
    setPage(1);
    fetchData(1, filters);
  };

  const resetFilters = () => {
    const cleared = { status: "", startDate: "", endDate: "" };
    setFilters(cleared);
    setPage(1);
    fetchData(1, cleared);
  };

  return (
    <DashboardPageShell
      eyebrow="Vendor Earnings"
      title="Earnings and settlement"
      description="Track every vendor sale, filter by payout state, and monitor what will be sent during the next weekend payout."
      actions={
        <button
          type="button"
          onClick={() => fetchData(page, filters)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="Net earned" value={formatMoney(overview?.totalNetAmount)} note="All-time vendor net" icon={FiDollarSign} tone="bg-white text-gray-950" />
        <DashboardStatCard label="Ready for payout" value={formatMoney(overview?.totalReadyForPayoutAmount)} note="Available for weekend settlement" icon={FiClock} tone="bg-[linear-gradient(135deg,#f97316,#ea580c)] text-white" />
        <DashboardStatCard label="Paid out" value={formatMoney(overview?.totalPaidAmount)} note="Completed weekend payouts" icon={FiCheckCircle} tone="bg-white text-gray-950" />
        <DashboardStatCard
          label="Next payout"
          value={overview?.nextWeekendPayoutDate ? new Date(overview.nextWeekendPayoutDate).toLocaleDateString() : "Pending"}
          note={overview?.hasDefaultPayoutAccount ? "Default payout account configured" : "Add a payout account in Vendor Hub"}
          icon={FiCalendar}
          tone="bg-white text-gray-950"
        />
      </div>

      <DashboardPanel>
        <div className="grid gap-4 md:grid-cols-4">
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className="w-full rounded-2xl border border-[#e8ded6] bg-[#fcfaf8] px-3 py-3 text-sm outline-none"
          >
            <option value="">All statuses</option>
            <option value="Available">Available</option>
            <option value="Paid">Paid</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
            className="w-full rounded-2xl border border-[#e8ded6] bg-[#fcfaf8] px-3 py-3 text-sm outline-none"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
            className="w-full rounded-2xl border border-[#e8ded6] bg-[#fcfaf8] px-3 py-3 text-sm outline-none"
          />
          <div className="flex gap-3">
            <button type="button" onClick={resetFilters} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Reset
            </button>
            <button type="button" onClick={applyFilters} className="w-full rounded-2xl bg-gray-950 px-4 py-3 text-sm font-medium text-white hover:bg-black">
              Apply
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-14 text-center text-sm text-gray-500">Loading earnings...</div>
        ) : earnings.length === 0 ? (
          <div className="py-14 text-center text-sm text-gray-500">No earnings found for the selected filters.</div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-[24px] border border-[#efe6de]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#fcfaf8]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Gross</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Charges</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Net</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {earnings.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fffaf5]">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{item.productName || "Product"}</div>
                      <div className="text-xs text-gray-500">{item.variantName || "Variant"} x {item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{String(item.orderId).slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatMoney(item.grossAmount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatMoney((item.platformCommissionAmount || 0) + (item.flatFeeAmount || 0))}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#166534]">{formatMoney(item.netAmount)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "Paid" ? "bg-[#ecfdf3] text-[#166534]" : "bg-[#fff7ed] text-[#c2410c]"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.earnedOn).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {earnings.length > 0 ? (
          <div className="mt-6">
            <PaginationAlt currentPage={page} totalPages={totalPages} totalRecords={totalRecords} pageSize={pageSize} onPageChange={setPage} />
          </div>
        ) : null}
      </DashboardPanel>
    </DashboardPageShell>
  );
}

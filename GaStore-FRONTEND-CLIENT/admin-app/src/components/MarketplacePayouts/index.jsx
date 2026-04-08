import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import requestHandler from "../../utils/requestHandler";
import endpointsPath from "../../constants/EndpointsPath";
import formatNumberToCurrency from "../../utils/numberToMoney";

const MarketplacePayouts = () => {
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [gateway, setGateway] = useState("Paystack");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [queueResp, historyResp] = await Promise.all([
        requestHandler.get(`${endpointsPath.vendorEarnings}/admin/payouts/queue`, true),
        requestHandler.get(`${endpointsPath.vendorEarnings}/admin/payouts/history?pageNumber=1&pageSize=10`, true),
      ]);

      if (queueResp.statusCode === 200) {
        setQueue(queueResp.result?.data || []);
      }

      if (historyResp.statusCode === 200) {
        setHistory(historyResp.result?.data || []);
      }
    } catch (error) {
      console.error("payout dashboard fetch failed", error);
      toast.error("Unable to load payout dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const processPayouts = async (vendorId = null) => {
    setProcessing(true);
    try {
      const response = await requestHandler.post(
        `${endpointsPath.vendorEarnings}/admin/payouts/process`,
        {
          vendorId,
          gateway,
        },
        true
      );

      if (response.statusCode === 200) {
        toast.success(response.result?.message || "Weekend payouts processed");
        fetchData();
      } else {
        toast.error(response.result?.message || "Unable to process payouts");
      }
    } catch (error) {
      console.error("payout process failed", error);
      toast.error("Unable to process payouts");
    } finally {
      setProcessing(false);
    }
  };

  const totalReady = queue.reduce((sum, item) => sum + Number(item.netAmount || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Weekend Vendor Payouts</h1>
            <p className="mt-2 text-sm text-gray-500">
              Review ready vendor earnings, confirm payout readiness, and trigger automated transfers via Paystack or Flutterwave.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={gateway}
              onChange={(event) => setGateway(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="Paystack">Paystack</option>
              <option value="Flutterwave">Flutterwave</option>
            </select>
            <button
              type="button"
              onClick={() => processPayouts()}
              disabled={processing || queue.length === 0}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {processing ? "Processing..." : "Run Weekend Payouts"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Vendors ready</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{queue.length}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total ready amount</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{formatNumberToCurrency(totalReady)}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Last 10 payouts</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{history.length}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">Ready queue</h2>
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading payout queue...</div>
          ) : queue.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">No vendors are ready for payout.</div>
          ) : (
            <div className="mt-4 space-y-4">
              {queue.map((item) => (
                <div key={item.vendorId} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{item.vendorName}</div>
                      <div className="text-sm text-gray-500">{item.vendorEmail}</div>
                      <div className="mt-2 text-sm text-gray-600">
                        {item.bankName || "No bank"} • {item.accountNumberMasked || "N/A"} • {item.preferredPayoutGateway || "Paystack"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Net payout</div>
                      <div className="text-xl font-bold text-gray-900">{formatNumberToCurrency(item.netAmount)}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
                    <span>{item.earningsCount} earning records</span>
                    <span>{item.orderCount} orders</span>
                    <span>{item.hasEligibleBankAccount ? "Payout ready" : "Missing valid bank account"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => processPayouts(item.vendorId)}
                    disabled={processing || !item.hasEligibleBankAccount}
                    className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
                  >
                    Pay this vendor
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">Recent payout history</h2>
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading payout history...</div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">No payout history yet.</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Gateway</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.vendorName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.gateway}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatNumberToCurrency(item.netAmount)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.status === "Paid" ? "bg-green-100 text-green-800" : item.status === "Failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(item.initiatedOn).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePayouts;

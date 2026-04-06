import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import requestHandler from "../../utils/requestHandler";
import endpointsPath from "../../constants/EndpointsPath";

const statusStyles = {
  Pending: "bg-blue-50 text-blue-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-rose-50 text-rose-700",
  PendingReview: "bg-blue-50 text-blue-700",
  Draft: "bg-slate-100 text-slate-700",
};

const documentCards = [
  {
    key: "livePictureUrl",
    label: "Live selfie",
  },
  {
    key: "validIdUrl",
    label: "Valid ID",
  },
  {
    key: "businessCertificateUrl",
    label: "Business certificate",
  },
];

const isPdfDocument = (url = "") => {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return url.toLowerCase().includes(".pdf");
  }
};

export default function MarketplaceModeration({ type = "kyc" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  const isKyc = type === "kyc";
  const title = isKyc ? "Pending KYC submissions" : "Pending product reviews";
  const endpoint = isKyc
    ? `${endpointsPath.adminModeration}/kyc/pending?pageNumber=1&pageSize=20`
    : `${endpointsPath.adminModeration}/products/pending?pageNumber=1&pageSize=20`;

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await requestHandler.get(endpoint, true);
      if (response.statusCode === 200) {
        setItems(response.result?.data || []);
      } else {
        toast.error(response.result?.message || "Unable to load moderation queue");
      }
    } catch (error) {
      console.error("marketplace moderation fetch failed", error);
      toast.error("Unable to load moderation queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [endpoint]);

  const moderateItem = async (id, action) => {
    const reason =
      action === "reject"
        ? window.prompt(isKyc ? "Why are you rejecting this KYC submission?" : "Why are you rejecting this product?")
        : "";

    if (action === "reject" && reason === null) {
      return;
    }

    setSubmittingId(id);
    try {
      const response =
        action === "approve"
          ? await requestHandler.post(`${endpointsPath.adminModeration}/${isKyc ? "kyc" : "products"}/${id}/approve`, {}, true)
          : await requestHandler.post(
              `${endpointsPath.adminModeration}/${isKyc ? "kyc" : "products"}/${id}/reject`,
              { reason },
              true
            );

      if (response.statusCode === 200) {
        toast.success(`${isKyc ? "KYC" : "Product"} ${action}d successfully`);
        await fetchItems();
      } else {
        toast.error(response.result?.message || `Unable to ${action} item`);
      }
    } catch (error) {
      console.error("marketplace moderation action failed", error);
      toast.error(`Unable to ${action} item`);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">Vendor moderation</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review incoming marketplace submissions before they become eligible to sell or appear in the storefront.
        </p>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">Loading moderation queue...</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">Nothing is pending review right now.</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const rawStatus = isKyc ? item.status : item.reviewStatus;
              const statusClass = statusStyles[rawStatus] || "bg-slate-100 text-slate-700";

              return (
                <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold text-slate-950">
                          {isKyc ? item.businessName || item.vendorName || "Unnamed vendor" : item.name}
                        </h2>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                          {(rawStatus || "").replace(/([a-z])([A-Z])/g, "$1 $2")}
                        </span>
                      </div>

                      {isKyc ? (
                        <>
                          <p className="text-sm text-slate-600">Vendor: {item.vendorName || "Unknown vendor"}</p>
                          <p className="text-sm text-slate-600">Email: {item.vendorEmail || "No email"}</p>
                          <p className="text-sm text-slate-600">ID Type: {item.idType || "Not supplied"}</p>
                          <p className="text-sm text-slate-600">Business Address: {item.businessAddress || "Not supplied"}</p>
                          <p className="text-sm text-slate-600">
                            Submitted: {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "Not recorded"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-slate-600">{item.description || "No description provided."}</p>
                          <p className="text-sm text-slate-600">
                            Submitted: {item.submittedForReviewAt ? new Date(item.submittedForReviewAt).toLocaleString() : "Not recorded"}
                          </p>
                        </>
                      )}
                    </div>

                  <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={submittingId === item.id}
                        onClick={() => moderateItem(item.id, "approve")}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={submittingId === item.id}
                        onClick={() => moderateItem(item.id, "reject")}
                        className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                      >
                        Reject
                      </button>
                  </div>
                </div>

                {isKyc ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {documentCards.map(({ key, label }) => {
                      const fileUrl = item[key];

                      if (!fileUrl) {
                        return (
                          <div key={key} className="rounded-[20px] border border-dashed border-slate-300 bg-white p-4">
                            <p className="text-sm font-semibold text-slate-900">{label}</p>
                            <p className="mt-2 text-sm text-slate-500">No file uploaded.</p>
                          </div>
                        );
                      }

                      const isPdf = isPdfDocument(fileUrl);

                      return (
                        <div key={key} className="rounded-[20px] border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{label}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                                {isPdf ? "PDF document" : "Image preview"}
                              </p>
                            </div>
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold text-orange-600 transition hover:text-orange-700"
                            >
                              Open file
                            </a>
                          </div>

                          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            {isPdf ? (
                              <div className="flex min-h-44 items-center justify-center p-6 text-center text-sm text-slate-600">
                                PDF preview is not embedded here. Use "Open file" to inspect the uploaded document.
                              </div>
                            ) : (
                              <img src={fileUrl} alt={label} className="h-44 w-full object-cover" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FiCheckCircle, FiClock, FiEdit3, FiPackage, FiPlusCircle, FiRefreshCw, FiSend, FiXCircle } from "react-icons/fi";
import requestHandler from "@/utils/requestHandler";
import endpointsPath from "@/constants/EndpointsPath";
import ProductWorkspaceShell, { ProductSurface } from "./ProductWorkspaceShell";

const statusTone = {
  Draft: "bg-slate-100 text-slate-700",
  PendingReview: "bg-blue-50 text-blue-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-rose-50 text-rose-700",
};

export default function VendorProductsDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await requestHandler.get(`${endpointsPath.vendor}/products?pageNumber=1&pageSize=20`, true);
      if (response.statusCode === 200) {
        setItems(response.result?.data || []);
      } else {
        toast.error(response.result?.message || "Unable to load vendor products");
      }
    } catch (error) {
      console.error("vendor products fetch failed", error);
      toast.error("Unable to load vendor products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const summaryStats = useMemo(() => {
    const draftCount = items.filter((item) => (item.reviewStatus || "Draft") === "Draft").length;
    const pendingCount = items.filter((item) => item.reviewStatus === "PendingReview").length;
    const approvedCount = items.filter((item) => item.reviewStatus === "Approved").length;
    const rejectedCount = items.filter((item) => item.reviewStatus === "Rejected").length;

    return [
      { label: "Products", value: items.length, helper: "Records" },
      { label: "Drafts", value: draftCount, helper: "Needs review" },
      { label: "Pending", value: pendingCount, helper: "With admin" },
      { label: "Approved", value: approvedCount + rejectedCount, helper: `${rejectedCount} rejected` },
    ];
  }, [items]);

  const submitForReview = async (id) => {
    setSubmittingId(id);
    try {
      const response = await requestHandler.post(`${endpointsPath.vendor}/products/${id}/submit-for-review`, {}, true);
      if (response.statusCode === 200) {
        toast.success("Product submitted for admin review");
        await fetchItems();
      } else {
        toast.error(response.result?.message || "Unable to submit product for review");
      }
    } catch (error) {
      console.error("vendor product review submit failed", error);
      toast.error("Unable to submit product for review");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <ProductWorkspaceShell
      eyebrow="Vendor Products"
      title="Catalog workspace"
      description="Create, revise, and resubmit your products in the same structured workflow used by the admin catalog. Every new product and every update still requires admin review before it goes live."
      stats={summaryStats}
      actions={
        <>
          <button
            type="button"
            onClick={fetchItems}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
          >
            <FiRefreshCw />
            Refresh
          </button>
          <Link
            href="/customer/vendor/products/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#f97316] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition hover:bg-[#ea580c]"
          >
            <FiPlusCircle />
            New product
          </Link>
        </>
      }
    >
      <ProductSurface>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Vendor products</h2>
            <p className="mt-1 text-sm text-slate-500">
              Drafts stay private until you submit them and an admin approves the review queue.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
            <FiPackage />
            {items.length} item{items.length === 1 ? "" : "s"}
          </div>
        </div>

        {loading ? (
          <div className="py-14 text-center text-sm text-slate-500">Loading vendor products...</div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-700">No vendor products yet</p>
            <p className="mt-2 text-sm text-slate-500">Create your first product draft, then send it to admin moderation.</p>
            <Link
              href="/customer/vendor/products/new"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#f97316] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ea580c]"
            >
              <FiPlusCircle />
              Create product
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {items.map((item) => {
              const reviewStatus = item.reviewStatus || "Draft";
              const isPending = reviewStatus === "PendingReview";
              const isApproved = reviewStatus === "Approved";
              const isRejected = reviewStatus === "Rejected";

              return (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-semibold tracking-tight text-slate-950">{item.name}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[reviewStatus] || statusTone.Draft}`}>
                          {reviewStatus.replace(/([a-z])([A-Z])/g, "$1 $2")}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                        {item.description || "No description provided yet."}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-500">
                      {isApproved ? <FiCheckCircle className="text-lg" /> : isRejected ? <FiXCircle className="text-lg" /> : <FiClock className="text-lg" />}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Created</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {item.dateCreated ? new Date(item.dateCreated).toLocaleDateString() : "Not recorded"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Submitted</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {item.submittedForReviewAt ? new Date(item.submittedForReviewAt).toLocaleDateString() : "Not sent"}
                      </p>
                    </div>
                  </div>

                  {item.reviewRejectionReason ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      Rejection reason: {item.reviewRejectionReason}
                    </div>
                  ) : null}

                  {isApproved ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      This product is approved. Editing it again will move it back into draft until you resubmit it for admin review.
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/customer/vendor/products/${item.id}/edit`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
                    >
                      <FiEdit3 />
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={isPending || submittingId === item.id}
                      onClick={() => submitForReview(item.id)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#f97316] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FiSend />
                      {isPending ? "Pending review" : "Submit for review"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ProductSurface>
    </ProductWorkspaceShell>
  );
}

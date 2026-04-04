"use client";

import endpointsPath from "@/constants/EndpointsPath";
import requestHandler from "@/utils/requestHandler";
import { formatImagePath } from "@/utils/formatImagePath";
import { stringToSLug } from "@/utils/stringToSlug";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiExternalLink,
  FiMessageSquare,
  FiPackage,
  FiStar,
} from "react-icons/fi";
import { DashboardPageShell, DashboardPanel, DashboardStatCard } from "../PageShell";

const EMPTY_REVIEW = {
  rating: 0,
  title: "",
  comment: "",
};

const ReviewsByUser = () => {
  const [reviewableProducts, setReviewableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingProductId, setSubmittingProductId] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  const fetchReviewableProducts = async () => {
    try {
      setLoading(true);
      const response = await requestHandler.get(
        `${endpointsPath.productReview}/mine/reviewables?pageNumber=1&pageSize=100`,
        true
      );
      if (response.statusCode === 200) {
        setReviewableProducts(response.result.data || []);
      } else {
        toast.error(response.result?.message || "Failed to load completed orders.");
      }
    } catch (error) {
      toast.error("Failed to load completed orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewableProducts();
  }, []);

  const reviewedCount = useMemo(
    () => reviewableProducts.filter((item) => item.hasReview).length,
    [reviewableProducts]
  );

  const pendingReviewCount = reviewableProducts.length - reviewedCount;

  const indexOfLastReview = currentPage * itemsPerPage;
  const indexOfFirstReview = indexOfLastReview - itemsPerPage;
  const currentReviews = reviewableProducts.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(reviewableProducts.length / itemsPerPage);

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    if (currentPage > 1 && indexOfFirstReview >= reviewableProducts.length) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, indexOfFirstReview, reviewableProducts.length, totalPages]);

  const handleDraftChange = (productId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || EMPTY_REVIEW),
        [field]: value,
      },
    }));
  };

  const handleToggleReviewForm = (productId) => {
    setExpandedProductId((prev) => (prev === productId ? null : productId));
    setDrafts((prev) => ({
      ...prev,
      [productId]: prev[productId] || { ...EMPTY_REVIEW },
    }));
  };

  const handleSubmitReview = async (product) => {
    const draft = drafts[product.productId] || EMPTY_REVIEW;

    if (!draft.rating) {
      toast.error("Please select a rating.");
      return;
    }

    if (!draft.title.trim() || !draft.comment.trim()) {
      toast.error("Please add a title and comment.");
      return;
    }

    try {
      setSubmittingProductId(product.productId);
      const response = await requestHandler.post(
        `${endpointsPath.productReview}`,
        {
          productId: product.productId,
          rating: draft.rating,
          title: draft.title.trim(),
          comment: draft.comment.trim(),
        },
        true
      );

      if (response.statusCode < 300) {
        toast.success("Review added successfully.");
        setExpandedProductId(null);
        setDrafts((prev) => ({
          ...prev,
          [product.productId]: { ...EMPTY_REVIEW },
        }));
        await fetchReviewableProducts();
        return;
      }

      toast.error(response.result?.message || "Unable to submit review.");
    } catch (error) {
      toast.error("Unable to submit review.");
    } finally {
      setSubmittingProductId(null);
    }
  };

  const Pagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i += 1) pageNumbers.push(i);

    return (
      <div className="mt-6 flex items-center justify-center">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`rounded-full p-2 ${currentPage === 1 ? "cursor-not-allowed text-gray-400" : "text-gray-700 hover:bg-gray-100"}`}
        >
          <FiChevronLeft size={20} />
        </button>

        <div className="mx-2 flex">
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`mx-1 h-10 w-10 rounded-full ${currentPage === number ? "bg-gray-950 text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {number}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`rounded-full p-2 ${currentPage === totalPages ? "cursor-not-allowed text-gray-400" : "text-gray-700 hover:bg-gray-100"}`}
        >
          <FiChevronRight size={20} />
        </button>
      </div>
    );
  };

  return (
    <DashboardPageShell
      eyebrow="Reviews"
      title="Completed Order Reviews"
      description="Review products from completed orders once per product, and track the feedback you have already shared."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard
          label="Completed Products"
          value={reviewableProducts.length}
          note="Unique products from completed orders"
          icon={FiPackage}
          tone="bg-[linear-gradient(135deg,#fff1e5,#fffaf5)] text-gray-950"
        />
        <DashboardStatCard
          label="Reviewed"
          value={reviewedCount}
          note="Products you have reviewed"
          icon={FiCheckCircle}
          tone="bg-white text-gray-950"
        />
        <DashboardStatCard
          label="Awaiting Review"
          value={pendingReviewCount}
          note="Still eligible for feedback"
          icon={FiMessageSquare}
          tone="bg-[linear-gradient(135deg,#f97316,#ea580c)] text-white"
        />
      </div>

      <DashboardPanel>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#ea580c]"></div>
          </div>
        ) : currentReviews.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No completed orders are ready for review yet.
          </div>
        ) : (
          <div className="space-y-4">
            {currentReviews.map((item) => {
              const draft = drafts[item.productId] || EMPTY_REVIEW;
              const isExpanded = expandedProductId === item.productId;
              const productHref = `/product/${stringToSLug(item.productName || "product")}?id=${item.productId}`;

              return (
                <div
                  key={item.productId}
                  className="rounded-[26px] border border-[#ece4db] bg-[#fffdfa] p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-[#f4ede7]">
                        {item.productImageUrl ? (
                          <img
                            src={formatImagePath(item.productImageUrl)}
                            alt={item.productName || "Product image"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <FiPackage />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-gray-950">{item.productName}</h4>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.hasReview
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-[#fff1e8] text-[#c2410c]"
                            }`}
                          >
                            {item.hasReview ? "Reviewed" : "Ready for review"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-gray-500">
                          Completed{" "}
                          {item.completedOn
                            ? new Date(item.completedOn).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "recently"}
                        </p>

                        {item.hasReview && item.review ? (
                          <div className="mt-3">
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FiStar
                                    key={star}
                                    className={`h-4 w-4 ${star <= item.review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {item.review.dateCreated
                                  ? new Date(item.review.dateCreated).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "Reviewed"}
                              </span>
                            </div>
                            <div className="mt-2 font-semibold text-gray-900">
                              {item.review.title}
                            </div>
                            <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                              {item.review.comment}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={productHref}
                        className="inline-flex items-center gap-2 rounded-full border border-[#eadfd6] bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-[#fff7f1]"
                      >
                        View Product
                        <FiExternalLink className="text-sm" />
                      </Link>

                      {!item.hasReview ? (
                        <button
                          type="button"
                          onClick={() => handleToggleReviewForm(item.productId)}
                          className="inline-flex items-center gap-2 rounded-full bg-[#ea580c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c2410c]"
                        >
                          <FiEdit3 />
                          {isExpanded ? "Close Form" : "Add Review"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {isExpanded && !item.hasReview ? (
                    <div className="mt-5 rounded-[24px] border border-[#f0dacc] bg-white p-4">
                      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c2410c]">
                        Review once
                      </div>
                      <h5 className="mt-2 text-lg font-semibold text-gray-950">
                        Share your feedback for {item.productName}
                      </h5>

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Rating
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleDraftChange(item.productId, "rating", star)}
                              className="rounded-full p-1"
                            >
                              <FiStar
                                className={`h-7 w-7 ${star <= draft.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Title
                          </label>
                          <input
                            type="text"
                            value={draft.title}
                            onChange={(e) =>
                              handleDraftChange(item.productId, "title", e.target.value)
                            }
                            className="w-full rounded-2xl border border-[#e8ded6] bg-[#fcfaf8] px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#f3c9a7] focus:bg-white"
                            placeholder="Summarize your experience"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Comment
                          </label>
                          <textarea
                            rows={4}
                            value={draft.comment}
                            onChange={(e) =>
                              handleDraftChange(item.productId, "comment", e.target.value)
                            }
                            className="w-full rounded-2xl border border-[#e8ded6] bg-[#fcfaf8] px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#f3c9a7] focus:bg-white"
                            placeholder="What stood out about the product?"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleSubmitReview(item)}
                          disabled={submittingProductId === item.productId}
                          className="rounded-full bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submittingProductId === item.productId ? "Submitting..." : "Submit Review"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedProductId(null)}
                          className="rounded-full border border-[#e8ded6] px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {reviewableProducts.length > itemsPerPage ? <Pagination /> : null}
      </DashboardPanel>
    </DashboardPageShell>
  );
};

export default ReviewsByUser;

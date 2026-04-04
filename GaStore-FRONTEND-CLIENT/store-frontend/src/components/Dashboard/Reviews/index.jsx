"use client";

import endpointsPath from "@/constants/EndpointsPath";
import requestHandler from "@/utils/requestHandler";
import { stringToSLug } from "@/utils/stringToSlug";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiExternalLink, FiMessageSquare, FiStar, FiUser } from "react-icons/fi";
import { DashboardPageShell, DashboardPanel, DashboardStatCard } from "../PageShell";

const ReviewsByUser = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const loggedInUser = async () => {
      const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user`, true);
      if (resp.statusCode === 200) {
        setUserId(resp.result.data[0]?.userId);
      }
    };
    loggedInUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    async function fetchProductReviews() {
      try {
        setLoading(true);
        const response = await requestHandler.getServerSide(`${endpointsPath.productReview}?userId=${userId}`, true);
        if (response?.statusCode <= 201) {
          setReviews(response.result.data || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProductReviews();
  }, [userId]);

  useEffect(() => {
    const loggedInUser = async () => {
      const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user-details`, true);
      if (resp.statusCode === 200) {
        setName(`${resp.result.data.firstName} ${resp.result.data.lastName}`);
      }
    };
    loggedInUser();
  }, []);

  const indexOfLastReview = currentPage * itemsPerPage;
  const indexOfFirstReview = indexOfLastReview - itemsPerPage;
  const currentReviews = reviews?.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(reviews?.length / itemsPerPage);
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const Pagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

    return (
      <div className="flex justify-center items-center mt-6">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-full ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
        >
          <FiChevronLeft size={20} />
        </button>

        <div className="flex mx-2">
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`w-10 h-10 mx-1 rounded-full ${currentPage === number ? "bg-gray-950 text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {number}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-full ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
        >
          <FiChevronRight size={20} />
        </button>
      </div>
    );
  };

  return (
    <DashboardPageShell
      eyebrow="Reviews"
      title="Your Reviews"
      description="All product feedback you have shared, in one place."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard label="Reviews" value={reviews.length} note="Published feedback" icon={FiMessageSquare} tone="bg-[linear-gradient(135deg,#fff1e5,#fffaf5)] text-gray-950" />
        <DashboardStatCard label="Average Rating" value={averageRating} note="Across all reviews" icon={FiStar} tone="bg-white text-gray-950" />
        <DashboardStatCard label="Visible Page" value={currentReviews.length} note="Reviews on this page" icon={FiUser} tone="bg-[linear-gradient(135deg,#f97316,#ea580c)] text-white" />
      </div>

      <DashboardPanel>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#ea580c]"></div>
          </div>
        ) : currentReviews?.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No reviews yet.</div>
        ) : (
          <div className="space-y-4">
            {currentReviews.map((review) => (
              <div key={review.id} className="rounded-[26px] border border-[#ece4db] bg-[#fffdfa] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4ede7] text-gray-600">
                      <FiUser />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-950">{`${review?.user?.firstName || name || ""} ${review?.user?.lastName || ""}`.trim() || "Review"}</h4>
                      <div className="mt-1 flex items-center gap-3">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar
                              key={star}
                              className={`w-4 h-4 ${star <= review?.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review?.date || review?.dateCreated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/product/${stringToSLug(review?.product?.name)}?id=${review?.product?.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[#eadfd6] bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-[#fff7f1]"
                  >
                    View Product
                    <FiExternalLink className="text-sm" />
                  </Link>
                </div>

                <div className="mt-4">
                  <div className="font-semibold text-gray-950">{review.title}</div>
                  <div className="mt-1 text-sm font-medium text-[#c2410c]">{review?.product?.name}</div>
                  <p className="mt-3 whitespace-pre-line text-gray-700">{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {reviews.length > itemsPerPage && <Pagination />}
      </DashboardPanel>
    </DashboardPageShell>
  );
};

export default ReviewsByUser;

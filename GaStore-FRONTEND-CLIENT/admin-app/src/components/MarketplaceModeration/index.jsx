import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [productDetails, setProductDetails] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);

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

  const toggleProductDetails = async (productId) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
      return;
    }

    setExpandedProductId(productId);
    if (productDetails[productId]) {
      return;
    }

    setDetailLoadingId(productId);
    try {
      const response = await requestHandler.get(`${endpointsPath.product}/admin/${productId}`, true);
      if (response?.statusCode === 200 && response.result?.data) {
        setProductDetails((current) => ({
          ...current,
          [productId]: response.result.data,
        }));
      } else {
        toast.error(response?.result?.message || "Unable to load product details");
      }
    } catch (error) {
      console.error("product details fetch failed", error);
      toast.error("Unable to load product details");
    } finally {
      setDetailLoadingId(null);
    }
  };

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

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : "Not recorded");
  const normalizeTags = (tags = []) => tags.map((tag) => (typeof tag === "string" ? tag : tag?.name)).filter(Boolean);
  const getPrimaryImage = (product) =>
    product?.images?.[0]?.imageUrl || product?.variants?.find((variant) => variant?.images?.length)?.images?.[0]?.imageUrl || "";
  const getLowestPrice = (product) => {
    const prices = (product?.variants || [])
      .flatMap((variant) => variant?.pricingTiers || [])
      .map((tier) => Number(tier?.pricePerUnit))
      .filter((price) => Number.isFinite(price) && price > 0);

    if (prices.length === 0) return null;
    return Math.min(...prices);
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
                            Submitted: {formatDateTime(item.submittedForReviewAt)}
                          </p>
                          <div className="flex flex-wrap gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => toggleProductDetails(item.id)}
                              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
                            >
                              {expandedProductId === item.id ? "Hide details" : "View details"}
                            </button>
                            <Link
                              to={`/products/${item.id}/details`}
                              className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                            >
                              Open full product page
                            </Link>
                          </div>
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
                ) : expandedProductId === item.id ? (
                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5">
                    {detailLoadingId === item.id ? (
                      <div className="py-8 text-center text-sm text-slate-500">Loading product details...</div>
                    ) : productDetails[item.id] ? (
                      (() => {
                        const product = productDetails[item.id];
                        const tags = normalizeTags(product.tags);
                        const primaryImage = getPrimaryImage(product);
                        const lowestPrice = getLowestPrice(product);

                        return (
                          <div className="space-y-5">
                            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                              <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100">
                                {primaryImage ? (
                                  <img src={primaryImage} alt={product.name} className="h-64 w-full object-cover" />
                                ) : (
                                  <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                                    No preview image available
                                  </div>
                                )}
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Brand</p>
                                  <p className="mt-1 text-sm text-slate-700">{product.brand?.name || "Not supplied"}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Category</p>
                                  <p className="mt-1 text-sm text-slate-700">
                                    {[product.category?.name, product.subCategory?.name, product.productType?.name, product.productSubType?.name]
                                      .filter(Boolean)
                                      .join(" / ") || "Not supplied"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Vendor</p>
                                  <p className="mt-1 text-sm text-slate-700">
                                    {product.user?.firstName || product.user?.email
                                      ? `${product.user?.firstName || ""} ${product.user?.lastName || ""}`.trim() || product.user?.email
                                      : "Unknown vendor"}
                                  </p>
                                  {product.user?.email ? <p className="text-xs text-slate-500">{product.user.email}</p> : null}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Created</p>
                                  <p className="mt-1 text-sm text-slate-700">{formatDateTime(product.dateCreated)}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Variants</p>
                                  <p className="mt-1 text-sm text-slate-700">{product.variants?.length || 0}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Starting Price</p>
                                  <p className="mt-1 text-sm text-slate-700">
                                    {lowestPrice !== null ? `₦${lowestPrice.toLocaleString()}` : "Not supplied"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-900">Description</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                                  {product.description || "No description provided."}
                                </p>
                              </div>

                              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-900">Highlights</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                                  {product.highlights || "No highlights provided."}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                              <p className="text-sm font-semibold text-slate-900">Tags</p>
                              {tags.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {tags.map((tag) => (
                                    <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-2 text-sm text-slate-500">No tags attached.</p>
                              )}
                            </div>

                            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                              <p className="text-sm font-semibold text-slate-900">Variants & pricing</p>
                              {product.variants?.length ? (
                                <div className="mt-4 overflow-x-auto">
                                  <table className="min-w-full text-left text-sm text-slate-600">
                                    <thead className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                      <tr>
                                        <th className="pb-3 pr-4 font-semibold">Variant</th>
                                        <th className="pb-3 pr-4 font-semibold">SKU</th>
                                        <th className="pb-3 pr-4 font-semibold">Stock</th>
                                        <th className="pb-3 pr-4 font-semibold">Weight</th>
                                        <th className="pb-3 font-semibold">Lowest price</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {product.variants.map((variant) => {
                                        const variantLowestPrice = Math.min(
                                          ...((variant.pricingTiers || [])
                                            .map((tier) => Number(tier?.pricePerUnit))
                                            .filter((price) => Number.isFinite(price) && price > 0))
                                        );

                                        return (
                                          <tr key={variant.id} className="border-t border-slate-200">
                                            <td className="py-3 pr-4">
                                              <div className="font-medium text-slate-800">{variant.name || "Untitled variant"}</div>
                                              <div className="text-xs text-slate-500">
                                                {[variant.color, variant.size, variant.style].filter(Boolean).join(" / ") || "No attributes"}
                                              </div>
                                            </td>
                                            <td className="py-3 pr-4">{variant.sellerSKU || "Not supplied"}</td>
                                            <td className="py-3 pr-4">{variant.stockQuantity ?? 0}</td>
                                            <td className="py-3 pr-4">{variant.weight ?? "Not supplied"}</td>
                                            <td className="py-3">
                                              {Number.isFinite(variantLowestPrice) ? `₦${variantLowestPrice.toLocaleString()}` : "Not supplied"}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="mt-2 text-sm text-slate-500">No variants configured.</p>
                              )}
                            </div>

                            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                              <p className="text-sm font-semibold text-slate-900">Specifications</p>
                              <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {[
                                  ["Main material", product.specifications?.mainMaterial],
                                  ["Material family", product.specifications?.materialFamily],
                                  ["Model", product.specifications?.model],
                                  ["Production country", product.specifications?.productionCountry],
                                  ["Product line", product.specifications?.productLine],
                                  ["Warranty duration", product.specifications?.warrantyDuration],
                                  ["Warranty type", product.specifications?.warrantyType],
                                  ["NAFDAC", product.specifications?.nafdac],
                                  ["FDA", product.specifications?.fda],
                                ]
                                  .filter(([, value]) => value)
                                  .map(([label, value]) => (
                                    <div key={label}>
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                                      <p className="mt-1 text-sm text-slate-700">{value}</p>
                                    </div>
                                  ))}
                              </div>
                              {product.specifications?.whatIsInTheBox ? (
                                <div className="mt-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">What is in the box</p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                                    {product.specifications.whatIsInTheBox}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="py-8 text-center text-sm text-slate-500">
                        Product details are not available yet. Use the full product page to inspect again.
                      </div>
                    )}
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

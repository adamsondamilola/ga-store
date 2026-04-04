"use client";

import React, { useState } from "react";
import endpointsPath from "@/constants/EndpointsPath";
import requestHandler from "@/utils/requestHandler";
import formatNumberToCurrency from "@/utils/numberToMoney";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiMapPin,
  FiPackage,
  FiSearch,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";

const ORDER_ID_MIN_LENGTH = 6;
const ORDER_ID_MAX_LENGTH = 8;

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDeliveryDate = (dateString) => {
  if (!dateString) return "Calculating...";
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getStatusTone = (order, shipping) => {
  if (shipping?.status === "Delivered") {
    return {
      label: "Delivered",
      className: "bg-green-100 text-green-800",
    };
  }

  if (shipping?.status === "Shipped") {
    return {
      label: "In Transit",
      className: "bg-blue-100 text-blue-800",
    };
  }

  if (order?.hasPaid) {
    return {
      label: "Processing",
      className: "bg-amber-100 text-amber-800",
    };
  }

  return {
    label: "Pending Payment",
    className: "bg-stone-200 text-stone-700",
  };
};

const getTimelineSteps = (order, shipping) => [
  {
    title: "Order placed",
    description: "We received your order and logged it into our system.",
    date: order?.dateCreated || order?.orderDate,
    active: true,
    icon: FiShoppingBag,
  },
  {
    title: "Processing",
    description: "We are confirming payment and preparing your items.",
    date: order?.hasPaid ? order?.dateCreated || order?.orderDate : null,
    active: Boolean(order?.hasPaid),
    icon: FiPackage,
  },
  {
    title: "Shipped",
    description: "Your order has left the store and is on the way.",
    date: shipping?.status === "Shipped" || shipping?.status === "Delivered" ? shipping?.dateUpdated : null,
    active: shipping?.status === "Shipped" || shipping?.status === "Delivered",
    icon: FiTruck,
  },
  {
    title: "Delivered",
    description: "The order has been marked as delivered.",
    date: shipping?.status === "Delivered" ? shipping?.dateUpdated : null,
    active: shipping?.status === "Delivered",
    icon: FiCheckCircle,
  },
];

const SummaryRow = ({ label, value, emphasized = false, valueClassName = "" }) => (
  <div className="flex items-center justify-between gap-4">
    <span className={emphasized ? "font-semibold text-slate-900" : "text-slate-600"}>{label}</span>
    <span className={`${emphasized ? "font-semibold text-slate-950" : "font-medium text-slate-900"} ${valueClassName}`.trim()}>
      {value}
    </span>
  </div>
);

const InfoCard = ({ title, children, className = "" }) => (
  <section className={`rounded-3xl border border-stone-200 bg-white p-6 shadow-sm ${className}`.trim()}>
    <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
    <div className="mt-5">{children}</div>
  </section>
);

const OrderItemCard = ({ item }) => {
  const imageUrl = item?.variant?.images?.[0]?.imageUrl ?? item?.product?.images?.[0]?.imageUrl;

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="h-24 w-full overflow-hidden rounded-2xl bg-stone-100 sm:w-24 sm:flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item?.product?.name || "Product image"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
              No Image
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                {item?.product?.name || "Unknown Product"}
              </h3>
              {item?.variant?.name && (
                <p className="mt-1 text-sm text-slate-500">Variant: {item.variant.name}</p>
              )}
            </div>
            <p className="text-base font-semibold text-slate-950">
              {formatNumberToCurrency(item?.price?.toFixed(2) || 0)}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-slate-500">Qty: {item?.quantity || 0}</span>
            <span className="font-semibold text-slate-900">
              {formatNumberToCurrency(((item?.price || 0) * (item?.quantity || 0)).toFixed(2))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderTrackingView = () => {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [shipping, setShipping] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (orderId.trim().length < ORDER_ID_MIN_LENGTH) {
      toast.error("Order ID must be at least 6 characters");
      return;
    }

    const trimmedOrderId = orderId.trim().substring(0, ORDER_ID_MAX_LENGTH);
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const orderResponse = await requestHandler.get(
        `${endpointsPath.order}/${trimmedOrderId}`,
        true
      );

      if (orderResponse.statusCode == 200) {
        const orderData = orderResponse.result.data;
        setOrder(orderData);

        try {
          const shippingResponse = await requestHandler.get(
            `${endpointsPath.shipping}/${orderData.id}`,
            true
          );

          if (shippingResponse.statusCode == 200) {
            setShipping(shippingResponse.result.data);
          } else {
            setShipping(null);
          }
        } catch (shippingError) {
          console.warn("Shipping details not found:", shippingError);
          setShipping(null);
        }
      } else {
        setError("Order not found");
        setOrder(null);
        setShipping(null);
      }
    } catch (err) {
      setError("Failed to fetch order details");
      setOrder(null);
      setShipping(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= ORDER_ID_MAX_LENGTH) {
      setOrderId(value);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && orderId.trim().length >= ORDER_ID_MIN_LENGTH) {
      handleSearch();
    }
  };

  const statusTone = order ? getStatusTone(order, shipping) : null;
  const timelineSteps = order ? getTimelineSteps(order, shipping) : [];
  const totalValue = order
    ? !order?.couponCode
      ? order?.amount?.toFixed(2)
      : order?.amountAfterDiscount?.toFixed(2)
    : 0;

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c2410c]">
                Order Tracking
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.5rem]">
                Check the status of your order in one place.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Enter the order ID from your confirmation message to view payment status,
                shipping progress, delivery details, and the items in your order.
              </p>
            </div>

            <div className="rounded-3xl bg-[#f8f6f1] p-5">
              <p className="text-sm font-semibold text-slate-900">Tracking tips</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>Use the first 6 to 8 characters of your order ID.</li>
                <li>Payment must be confirmed before shipping updates appear.</li>
                <li>If tracking still looks wrong, contact support with your order ID.</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-stone-200 bg-[#fcfbf8] p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={orderId}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter your order ID"
                  className="w-full rounded-2xl border border-stone-300 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-[#f97316]"
                  maxLength={ORDER_ID_MAX_LENGTH}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || orderId.trim().length < ORDER_ID_MIN_LENGTH}
                className="inline-flex items-center justify-center rounded-2xl bg-[#f97316] px-6 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Searching..." : "Track Order"}
              </button>
            </div>
            {orderId.length > 0 && orderId.length < ORDER_ID_MIN_LENGTH && (
              <p className="mt-3 text-sm text-red-500">
                Order ID must be at least 6 characters.
              </p>
            )}
          </div>
        </section>

        {loading && (
          <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-10 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-stone-200 border-t-[#f97316]" />
              <div>
                <p className="text-base font-semibold text-slate-900">Fetching your order</p>
                <p className="mt-1 text-sm text-slate-500">This usually takes a moment.</p>
              </div>
            </div>
          </div>
        )}

        {error && searched && !loading && (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <FiAlertCircle />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-700">We couldn’t find that order</h2>
                <p className="mt-2 text-sm leading-6 text-red-600">{error}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Double-check the order ID and try again. If you still need help, contact support.
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && !order && searched && !error && (
          <div className="mt-8 rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <p className="text-lg font-semibold text-blue-700">Ready to track</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter your order ID above to view the latest order and shipping details.
            </p>
          </div>
        )}

        {order && !loading && (
          <div className="mt-8 space-y-6">
            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Order Reference
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      #{order.id.substring(0, ORDER_ID_MAX_LENGTH).toUpperCase()}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Placed on {formatDate(order.orderDate)}
                    </p>
                  </div>

                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusTone.className}`}>
                    {statusTone.label}
                  </span>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#f8f6f1] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Payment
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {order.hasPaid ? "Confirmed" : "Awaiting payment"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f8f6f1] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Delivery
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {shipping?.status || "Processing"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f8f6f1] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Total
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {formatNumberToCurrency(totalValue || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <InfoCard title="Delivery overview">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <FiTruck />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Estimated delivery</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {shipping ? formatDeliveryDate(shipping.estimatedDeliveryDate) : "We’ll show this once shipping is available."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-slate-600">
                      <FiMapPin />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Shipping method</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {shipping?.shippingMethod || "Standard delivery"}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#f8f6f1] p-4 text-sm leading-6 text-slate-600">
                    Tracking updates appear as the order moves from payment confirmation to delivery.
                  </div>
                </div>
              </InfoCard>
            </section>

            <InfoCard title="Order progress">
              <div className="space-y-5">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            step.active ? "bg-[#f97316] text-white" : "bg-stone-100 text-stone-400"
                          }`}
                        >
                          <Icon className="text-base" />
                        </div>
                        {index < timelineSteps.length - 1 && (
                          <div className={`mt-2 h-12 w-px ${step.active ? "bg-orange-200" : "bg-stone-200"}`} />
                        )}
                      </div>

                      <div className="pb-2">
                        <p className={`text-base font-semibold ${step.active ? "text-slate-950" : "text-slate-500"}`}>
                          {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
                        {step.date && (
                          <p className="mt-1 text-sm text-slate-500">{formatDate(step.date)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </InfoCard>

            <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              {shipping && (
                <InfoCard title="Shipping information">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Delivery Address
                      </p>
                      <div className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
                        <p className="font-medium text-slate-900">{shipping.fullName}</p>
                        <p>{shipping.addressLine1}</p>
                        {shipping.addressLine2 && <p>{shipping.addressLine2}</p>}
                        <p>
                          {shipping.city}, {shipping.state} {shipping.postalCode}
                        </p>
                        <p>{shipping.country}</p>
                        <p className="pt-2 text-slate-900">Phone: {shipping.phoneNumber}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Shipping Details
                      </p>
                      <div className="mt-3 space-y-4 text-sm">
                        <SummaryRow label="Method" value={shipping.shippingMethod || "Standard"} />
                        <SummaryRow label="Status" value={shipping?.status?.toLowerCase() || "processing"} />
                        <SummaryRow label="Estimated delivery" value={formatDeliveryDate(shipping.estimatedDeliveryDate)} />
                        <SummaryRow
                          label="Shipping cost"
                          value={formatNumberToCurrency(order?.deliveryFee?.toFixed(2) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </InfoCard>
              )}

              <InfoCard title="Order summary">
                <div className="space-y-4 text-sm">
                  <SummaryRow
                    label="Subtotal"
                    value={formatNumberToCurrency(order?.subTotal?.toFixed(2) || 0)}
                  />

                  {order.discountPercentage > 0 && (
                    <SummaryRow
                      label={`Discount (${order.discountPercentage}%)`}
                      value={`-${formatNumberToCurrency((order.subTotal - order.subTotalAfterDiscount).toFixed(2))}`}
                      valueClassName="text-red-600"
                    />
                  )}

                  <SummaryRow
                    label="Shipping"
                    value={formatNumberToCurrency(order?.deliveryFee?.toFixed(2) || 0)}
                  />

                  {order.tax > 0 && (
                    <SummaryRow
                      label="VAT"
                      value={formatNumberToCurrency(order.tax.toFixed(2))}
                    />
                  )}

                  {order.couponCode && (
                    <SummaryRow
                      label="Coupon"
                      value={`${order.couponCode} (${order.discountPercentage || 0}% off)`}
                    />
                  )}

                  <div className="border-t border-stone-200 pt-4">
                    <SummaryRow
                      label="Total"
                      value={formatNumberToCurrency(totalValue || 0)}
                      emphasized
                    />
                  </div>
                </div>
              </InfoCard>
            </section>

            <InfoCard title="Order items">
              <div className="divide-y divide-stone-200">
                {order.items?.map((item) => (
                  <OrderItemCard key={item.id} item={item} />
                ))}
              </div>
            </InfoCard>

            <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Need more help?</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    If this order still looks wrong, reach out to support with your order ID.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
                >
                  Contact support
                  <FiArrowRight />
                </Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingView;

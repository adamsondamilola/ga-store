"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FiCamera, FiCheckCircle, FiClock, FiFileText, FiPlusCircle, FiRefreshCw, FiShield, FiUploadCloud, FiXCircle } from "react-icons/fi";
import { DashboardPageShell, DashboardPanel, DashboardStatCard } from "../PageShell";
import requestHandler from "@/utils/requestHandler";
import endpointsPath from "@/constants/EndpointsPath";

const kycToneMap = {
  NotStarted: {
    label: "Not Started",
    tone: "bg-[#fff7ed] text-[#9a3412]",
    icon: FiFileText,
  },
  Pending: {
    label: "Pending",
    tone: "bg-[#eff6ff] text-[#1d4ed8]",
    icon: FiClock,
  },
  Approved: {
    label: "Approved",
    tone: "bg-[#ecfdf3] text-[#166534]",
    icon: FiCheckCircle,
  },
  Rejected: {
    label: "Rejected",
    tone: "bg-[#fef2f2] text-[#b91c1c]",
    icon: FiXCircle,
  },
};

const buildFormData = (values, submitForReview = false) => {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      formData.append(key, value);
    }
  });

  formData.append("submitForReview", String(submitForReview));
  return formData;
};

export default function VendorDashboard() {
  const [status, setStatus] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    businessAddress: "",
    idType: "",
    livePicture: null,
    validId: null,
    businessCertificate: null,
  });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const [statusResp, productsResp] = await Promise.all([
        requestHandler.get(`${endpointsPath.vendor}/kyc/status`, true),
        requestHandler.get(`${endpointsPath.vendor}/products?pageNumber=1&pageSize=10`, true),
      ]);

      if (statusResp.statusCode === 200) {
        const payload = statusResp.result?.data || null;
        setStatus(payload);
        setForm((current) => ({
          ...current,
          businessName: payload?.kyc?.businessName || current.businessName,
          businessAddress: payload?.kyc?.businessAddress || current.businessAddress,
          idType: payload?.kyc?.idType || current.idType,
        }));
      }

      if (productsResp.statusCode === 200) {
        setProducts(productsResp.result?.data || []);
      }
    } catch (error) {
      console.error("vendor dashboard fetch failed", error);
      toast.error("Unable to load vendor dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraOpen || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    const startCamera = async () => {
      setCameraLoading(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error("camera access failed", error);
        toast.error("Unable to access your camera");
        setCameraOpen(false);
      } finally {
        setCameraLoading(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpen]);

  const kycMeta = useMemo(() => {
    const key = status?.kycStatus || "NotStarted";
    return kycToneMap[key] || kycToneMap.NotStarted;
  }, [status]);
  const StatusIcon = kycMeta.icon;

  const activateVendor = async () => {
    setSaving(true);
    try {
      const response = await requestHandler.post(`${endpointsPath.vendor}/account/become-vendor`, {}, true);
      if (response.statusCode === 200) {
        toast.success("Vendor account activated");
        await fetchVendorData();
        return;
      }

      toast.error(response.result?.message || "Unable to activate vendor account");
    } finally {
      setSaving(false);
    }
  };

  const saveKyc = async (submitForReview = false) => {
    setSaving(true);
    try {
      const formData = buildFormData(form, submitForReview);
      const response = submitForReview
        ? await requestHandler.postForm(`${endpointsPath.vendor}/kyc/submit`, formData, true)
        : await requestHandler.putForm(`${endpointsPath.vendor}/kyc/update`, formData, true);

      if (response.statusCode === 200) {
        toast.success(submitForReview ? "KYC submitted successfully" : "KYC draft saved");
        setForm((current) => ({
          ...current,
          livePicture: null,
          validId: null,
          businessCertificate: null,
        }));
        await fetchVendorData();
        return;
      }

      toast.error(response.result?.message || "Unable to save KYC");
    } finally {
      setSaving(false);
    }
  };

  const openCamera = () => {
    setCameraOpen(true);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCameraLoading(false);
  };

  const captureSelfie = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error("Camera is not ready yet");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 540;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Unable to capture selfie");
          return;
        }

        const file = new File([blob], `selfie-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });

        setForm((current) => ({ ...current, livePicture: file }));
        toast.success("Selfie captured successfully");
        closeCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  const statusBadge = (
    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${kycMeta.tone}`}>
      <StatusIcon className="text-base" />
      {kycMeta.label}
    </div>
  );

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[32px] bg-white/80" />;
  }

  return (
    <DashboardPageShell
      eyebrow="Vendor Hub"
      title="Multi-vendor setup"
      description="Complete KYC, monitor moderation status, and unlock product posting when approval is in place."
      actions={
        <>
          {!status?.isVendor ? (
            <button
              type="button"
              onClick={activateVendor}
              disabled={saving}
              className="rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              Become Vendor
            </button>
          ) : null}
          <Link
            href="/customer/vendor/products"
            className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
              status?.canPost
                ? "bg-[#f97316] text-white hover:bg-[#ea580c]"
                : "cursor-not-allowed bg-gray-200 text-gray-500"
            }`}
            aria-disabled={!status?.canPost}
          >
            <FiPlusCircle />
            Post Product
          </Link>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard
          label="Vendor account"
          value={status?.isVendor ? "Active" : "Inactive"}
          note={status?.isVendor ? "Marketplace access enabled" : "Activate vendor mode first"}
          icon={FiShield}
          tone="bg-white text-gray-950"
        />
        <DashboardStatCard
          label="KYC status"
          value={kycMeta.label}
          note={status?.canPost ? "You can submit products" : "Posting stays locked until approval"}
          icon={kycMeta.icon}
          tone="bg-white text-gray-950"
        />
        <DashboardStatCard
          label="Products"
          value={products.length}
          note="Recent vendor product records"
          icon={FiUploadCloud}
          tone="bg-white text-gray-950"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">KYC Submission</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-950">Verification details</h2>
            </div>
            {statusBadge}
          </div>

          {status?.kyc?.rejectionReason ? (
            <div className="mt-5 rounded-[22px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
              Rejection reason: {status.kyc.rejectionReason}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Business name</span>
              <input
                value={form.businessName}
                onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))}
                className="w-full rounded-2xl border border-[#e7ddd3] bg-[#fcfbf8] px-4 py-3 text-sm outline-none focus:border-[#f97316]"
                placeholder="Registered business name"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">ID type</span>
              <input
                value={form.idType}
                onChange={(event) => setForm((current) => ({ ...current, idType: event.target.value }))}
                className="w-full rounded-2xl border border-[#e7ddd3] bg-[#fcfbf8] px-4 py-3 text-sm outline-none focus:border-[#f97316]"
                placeholder="National ID, Passport, Driver's License..."
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Business address</span>
              <textarea
                value={form.businessAddress}
                onChange={(event) => setForm((current) => ({ ...current, businessAddress: event.target.value }))}
                className="min-h-28 w-full rounded-2xl border border-[#e7ddd3] bg-[#fcfbf8] px-4 py-3 text-sm outline-none focus:border-[#f97316]"
                placeholder="Registered business address"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Live / selfie image</span>
              <div className="space-y-3 rounded-[22px] border border-[#e7ddd3] bg-[#fcfbf8] p-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openCamera}
                    className="inline-flex items-center gap-2 rounded-full bg-[#f97316] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ea580c]"
                  >
                    <FiCamera />
                    Take Selfie
                  </button>
                  {/*<label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50">
                    <FiUploadCloud />
                    Upload Instead
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={(event) =>
                        setForm((current) => ({ ...current, livePicture: event.target.files?.[0] || null }))
                      }
                      className="hidden"
                    />
                  </label>*/}
                </div>
                <p className="text-xs text-gray-500">
                  Use the selfie button to open a live front-camera preview and capture your verification image.
                </p>
                {form.livePicture ? (
                  <div className="rounded-2xl border border-[#fed7aa] bg-white px-3 py-2 text-sm text-gray-700">
                    Selected selfie: {form.livePicture.name}
                  </div>
                ) : null}

                {cameraOpen ? (
                  <div className="rounded-[24px] border border-[#f3d4bf] bg-[#fff7f1] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-950">Live selfie capture</div>
                        <div className="mt-1 text-xs text-gray-500">
                          Center your face in the frame, then capture the image.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={closeCamera}
                        className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                      >
                        Close Camera
                      </button>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[22px] border border-[#e7ddd3] bg-black">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>

                    <canvas ref={canvasRef} className="hidden" />

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={captureSelfie}
                        disabled={cameraLoading}
                        className="inline-flex items-center gap-2 rounded-full bg-[#f97316] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ea580c] disabled:opacity-60"
                      >
                        <FiCamera />
                        Capture Selfie
                      </button>
                      <button
                        type="button"
                        onClick={closeCamera}
                        disabled={cameraLoading}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
                      >
                        <FiRefreshCw />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Valid ID</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(event) => setForm((current) => ({ ...current, validId: event.target.files?.[0] || null }))}
                className="block w-full rounded-2xl border border-[#e7ddd3] bg-[#fcfbf8] px-4 py-3 text-sm"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Business certificate (optional)</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(event) =>
                  setForm((current) => ({ ...current, businessCertificate: event.target.files?.[0] || null }))
                }
                className="block w-full rounded-2xl border border-[#e7ddd3] bg-[#fcfbf8] px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => saveKyc(false)}
              className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => saveKyc(true)}
              className="rounded-full bg-[#f97316] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ea580c] disabled:opacity-60"
            >
              Submit KYC
            </button>
          </div>

        </DashboardPanel>

        <DashboardPanel>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Product Posting</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-950">Readiness check</h2>

          <div className="mt-5 space-y-3">
            <div className="rounded-[22px] bg-[#fcfbf8] p-4">
              <div className="text-sm font-semibold text-gray-950">Posting access</div>
              <div className="mt-2 text-sm text-gray-600">
                {status?.canPost
                  ? "Approved vendors can create and submit products for moderation."
                  : "Post Product stays disabled until KYC is approved by an admin."}
              </div>
            </div>

            <div className="rounded-[22px] bg-[#fcfbf8] p-4">
              <div className="text-sm font-semibold text-gray-950">Latest products</div>
              <div className="mt-3 space-y-2">
                {products.length > 0 ? (
                  products.slice(0, 5).map((product) => (
                    <div key={product.id} className="rounded-2xl border border-[#eee5dc] bg-white px-4 py-3">
                      <div className="font-medium text-gray-950">{product.name}</div>
                      <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                        {(product.reviewStatus || "Draft").replace(/([a-z])([A-Z])/g, "$1 $2")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#e7ddd3] px-4 py-5 text-sm text-gray-500">
                    No vendor products yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </DashboardPanel>
      </div>
    </DashboardPageShell>
  );
}

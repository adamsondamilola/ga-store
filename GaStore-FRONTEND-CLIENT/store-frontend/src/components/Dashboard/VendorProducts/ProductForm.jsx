"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiArrowLeft, FiEdit3, FiFileText, FiLoader, FiPackage, FiSave, FiSend } from "react-icons/fi";
import requestHandler from "@/utils/requestHandler";
import endpointsPath from "@/constants/EndpointsPath";
import ProductWorkspaceShell, { ProductSurface } from "./ProductWorkspaceShell";

const inputClass =
  "mt-1 w-full rounded-2xl border border-[#e7ddd3] bg-[#fcfbf8] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#f97316]";
const textAreaClass = `${inputClass} min-h-[120px]`;
const countryOptions = ["Nigeria", "Ghana", "Kenya", "South Africa", "United Kingdom", "United States"];
const productColors = ["Red", "Orange", "Yellow", "Green", "Blue", "Black", "White", "Gray", "Brown", "Pink"];
const reviewTone = {
  Draft: "bg-slate-100 text-slate-700",
  PendingReview: "bg-blue-50 text-blue-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-rose-50 text-rose-700",
};
const productConditionOptions = [
  { value: 0, label: "Not Applicable" },
  { value: 1, label: "New" },
  { value: 2, label: "Used" },
  { value: 3, label: "Refurbished" },
];

const emptyVariant = () => ({
  id: "",
  name: "",
  color: "",
  size: "",
  style: "",
  sellerSKU: "",
  barCode: "",
  stockQuantity: 0,
  weight: 0,
  saleStartDate: "",
  saleEndDate: "",
  images: [],
  pricingTiers: [{ id: "", minQuantity: 1, pricePerUnit: 0, pricePerUnitGlobal: 0 }],
});

const defaultSpecification = {
  certification: "",
  mainMaterial: "",
  materialFamily: "",
  model: "",
  productionCountry: "",
  productLine: "",
  warrantyDuration: "",
  warrantyType: "",
  youTubeId: "",
  nafdac: "",
  fda: "",
  disclaimer: "",
  fromTheManufacturer: "",
  whatIsInTheBox: "",
  productWarranty: "",
  warrantyAddress: "",
};

const normalizeImages = (images = []) =>
  images.map((image) =>
    typeof image === "string" ? { imageUrl: image } : { ...image, imageUrl: image.imageUrl || image.url || "" }
  );

const normalizeYouTubeId = (value = "") => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";

  try {
    const parsedUrl = new URL(trimmedValue);
    const host = parsedUrl.hostname.toLowerCase();

    if (host.includes("youtu.be")) {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] || trimmedValue;
    }

    if (host.includes("youtube.com")) {
      const watchId = parsedUrl.searchParams.get("v");
      if (watchId) return watchId;

      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      if (segments.length >= 2 && ["embed", "shorts"].includes(segments[0])) {
        return segments[1];
      }
    }
  } catch {
    return trimmedValue;
  }

  return trimmedValue;
};

const normalizeProductPayload = (product) => ({
  id: product.id || "",
  reviewStatus: product.reviewStatus || "Draft",
  reviewRejectionReason: product.reviewRejectionReason || "",
  submittedForReviewAt: product.submittedForReviewAt || null,
  productInfo: {
    id: product.id || "",
    name: product.name || "",
    description: product.description || "",
    highlights: product.highlights || "",
    weight: product.weight || "",
    primaryColor: product.primaryColor || "",
    condition: product.condition ?? 0,
    stockQuantity: product.stockQuantity || 0,
    isAvailable: product.isAvailable ?? true,
    isAvailableOnRequest: product.isAvailableOnRequest ?? false,
    brandId: product.brandId || "",
    categoryId: product.category?.id || product.categoryId || "",
    subCategoryId: product.subCategory?.id || product.subCategoryId || "",
    productTypeId: product.productType?.id || product.productTypeId || "",
    productSubTypeId: product.productSubType?.id || product.productSubTypeId || "",
    tags: (product.tags || []).map((tag) => (typeof tag === "string" ? tag : tag.name)).filter(Boolean),
  },
  images: normalizeImages(product.images || []),
  variants: (product.variants || product.variantsDto || []).map((variant) => ({
    id: variant.id || "",
    name: variant.name || "",
    color: variant.color || "",
    size: variant.size || "",
    style: variant.style || "",
    sellerSKU: variant.sellerSKU || "",
    barCode: variant.barCode || "",
    stockQuantity: variant.stockQuantity || 0,
    weight: variant.weight || 0,
    saleStartDate: variant.saleStartDate ? String(variant.saleStartDate).slice(0, 16) : "",
    saleEndDate: variant.saleEndDate ? String(variant.saleEndDate).slice(0, 16) : "",
    images: normalizeImages(variant.images || []),
    pricingTiers:
      (variant.pricingTiersDto || variant.pricingTiers || [])?.map((tier) => ({
        id: tier.id || "",
        minQuantity: tier.minQuantity || 1,
        pricePerUnit: tier.pricePerUnit || 0,
        pricePerUnitGlobal: tier.pricePerUnitGlobal || 0,
      })) || emptyVariant().pricingTiers,
  })),
  specification: { ...defaultSpecification, ...(product.specifications || {}) },
});

export default function ProductForm({ mode = "create", productId = null }) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const stepOneRef = useRef(null);
  const stepTwoRef = useRef(null);
  const stepThreeRef = useRef(null);
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [tags, setTags] = useState([]);
  const [brandQuery, setBrandQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [productState, setProductState] = useState({
    id: "",
    reviewStatus: "Draft",
    reviewRejectionReason: "",
    submittedForReviewAt: null,
    productInfo: {
      id: "",
      name: "",
      description: "",
      highlights: "",
      weight: "",
      primaryColor: "",
      condition: 0,
      stockQuantity: 0,
      isAvailable: true,
      isAvailableOnRequest: false,
      brandId: "",
      categoryId: "",
      subCategoryId: "",
      productTypeId: "",
      productSubTypeId: "",
      tags: [],
    },
    images: [],
    variants: [emptyVariant()],
    specification: defaultSpecification,
  });

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === productState.productInfo.categoryId) || null,
    [categories, productState.productInfo.categoryId]
  );
  const selectedSubCategory = useMemo(
    () => selectedCategory?.subCategories?.find((item) => item.id === productState.productInfo.subCategoryId) || null,
    [selectedCategory, productState.productInfo.subCategoryId]
  );
  const selectedProductType = useMemo(
    () => selectedSubCategory?.productTypes?.find((item) => item.id === productState.productInfo.productTypeId) || null,
    [selectedSubCategory, productState.productInfo.productTypeId]
  );

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [categoryRes, brandRes, tagRes] = await Promise.all([
          requestHandler.get(`${endpointsPath.category}/full-hierarchy`, true),
          requestHandler.get(`${endpointsPath.brand}?pageNumber=1&pageSize=100`, true),
          requestHandler.get(`${endpointsPath.tag}?pageNumber=1&pageSize=100`, true),
        ]);
        if (categoryRes.statusCode === 200) setCategories(categoryRes.result?.data || []);
        if (brandRes.statusCode === 200) setBrands(brandRes.result?.data || []);
        if (tagRes.statusCode === 200) setTags(tagRes.result?.data || []);
      } catch (error) {
        console.error("vendor product dependencies failed", error);
        toast.error("Unable to load product setup data");
      }
    };

    loadDependencies();
  }, []);

  useEffect(() => {
    if (!isEdit || !productId) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await requestHandler.get(`${endpointsPath.product}/${productId}`, true);
        if (response.statusCode === 200 && response.result?.data) {
          const normalized = normalizeProductPayload(response.result.data);
          setProductState(normalized);
          setBrandQuery(response.result.data.brand?.name || "");
        } else {
          toast.error(response.result?.message || "Unable to load product");
        }
      } catch (error) {
        console.error("vendor product fetch failed", error);
        toast.error("Unable to load product");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [isEdit, productId]);

  useEffect(() => {
    const onScroll = () => {
      const positions = [
        stepOneRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
        stepTwoRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
        stepThreeRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
      ];
      if (positions[2] <= 180) setActiveStep(3);
      else if (positions[1] <= 180) setActiveStep(2);
      else setActiveStep(1);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const setProductInfo = (updates) =>
    setProductState((current) => ({
      ...current,
      productInfo: { ...current.productInfo, ...updates },
    }));

  const setSpecification = (updates) =>
    setProductState((current) => ({
      ...current,
      specification: { ...current.specification, ...updates },
    }));

  const addTag = (tagName) => {
    const nextTag = tagName.trim();
    if (!nextTag) return;
    setProductInfo({
      tags: Array.from(new Set([...(productState.productInfo.tags || []), nextTag])),
    });
    setTagQuery("");
  };

  const removeTag = (tagName) =>
    setProductInfo({
      tags: (productState.productInfo.tags || []).filter((tag) => tag !== tagName),
    });

  const renderSubmitButtons = (placement = "top") => (
    <div className={`flex flex-wrap gap-3 ${placement === "bottom" ? "justify-end" : ""}`}>
      <button
        type="button"
        disabled={submitting}
        onClick={() => submitProduct(false)}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? <FiLoader className="animate-spin" /> : <FiSave />}
        Save draft
      </button>
      <button
        type="button"
        disabled={submitting}
        onClick={() => submitProduct(true)}
        className="inline-flex items-center gap-2 rounded-2xl bg-[#f97316] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? <FiLoader className="animate-spin" /> : <FiSend />}
        {isEdit ? "Update + submit" : "Create + submit"}
      </button>
    </div>
  );

  const addProductImages = (files) => {
    const mappedFiles = Array.from(files || []).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      imageUrl: "",
    }));
    setProductState((current) => ({
      ...current,
      images: [...current.images, ...mappedFiles].slice(0, 10),
    }));
  };

  const removeProductImage = (index) =>
    setProductState((current) => ({
      ...current,
      images: current.images.filter((_, itemIndex) => itemIndex !== index),
    }));

  const updateVariant = (variantIndex, updates) =>
    setProductState((current) => ({
      ...current,
      variants: current.variants.map((variant, index) =>
        index === variantIndex ? { ...variant, ...updates } : variant
      ),
    }));

  const addVariant = () =>
    setProductState((current) => ({
      ...current,
      variants: [...current.variants, emptyVariant()],
    }));

  const removeVariant = (variantIndex) =>
    setProductState((current) => ({
      ...current,
      variants: current.variants.filter((_, index) => index !== variantIndex),
    }));

  const addVariantImages = (variantIndex, files) => {
    const mappedFiles = Array.from(files || []).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      imageUrl: "",
    }));
    setProductState((current) => ({
      ...current,
      variants: current.variants.map((variant, index) =>
        index === variantIndex ? { ...variant, images: [...variant.images, ...mappedFiles].slice(0, 5) } : variant
      ),
    }));
  };

  const removeVariantImage = (variantIndex, imageIndex) =>
    setProductState((current) => ({
      ...current,
      variants: current.variants.map((variant, index) =>
        index === variantIndex
          ? { ...variant, images: variant.images.filter((_, currentImageIndex) => currentImageIndex !== imageIndex) }
          : variant
      ),
    }));

  const updatePricingTier = (variantIndex, tierIndex, updates) =>
    setProductState((current) => ({
      ...current,
      variants: current.variants.map((variant, index) =>
        index === variantIndex
          ? {
              ...variant,
              pricingTiers: variant.pricingTiers.map((tier, currentTierIndex) =>
                currentTierIndex === tierIndex ? { ...tier, ...updates } : tier
              ),
            }
          : variant
      ),
    }));

  const addPricingTier = (variantIndex) =>
    setProductState((current) => ({
      ...current,
      variants: current.variants.map((variant, index) =>
        index === variantIndex
          ? {
              ...variant,
              pricingTiers: [
                ...variant.pricingTiers,
                {
                  id: "",
                  minQuantity: (variant.pricingTiers.at(-1)?.minQuantity || 0) + 1,
                  pricePerUnit: 0,
                  pricePerUnitGlobal: variant.pricingTiers[0]?.pricePerUnitGlobal || 0,
                },
              ],
            }
          : variant
      ),
    }));

  const removePricingTier = (variantIndex, tierIndex) =>
    setProductState((current) => ({
      ...current,
      variants: current.variants.map((variant, index) =>
        index === variantIndex
          ? { ...variant, pricingTiers: variant.pricingTiers.filter((_, currentTierIndex) => currentTierIndex !== tierIndex) }
          : variant
      ),
    }));

  const scrollToStep = (step) => {
    setActiveStep(step);
    document.getElementById(`vendor-product-step-${step}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filteredBrands = useMemo(
    () => brands.filter((brand) => brand.name?.toLowerCase().includes(brandQuery.toLowerCase())),
    [brands, brandQuery]
  );
  const filteredTags = useMemo(
    () => tags.filter((tag) => tag.name?.toLowerCase().includes(tagQuery.toLowerCase())),
    [tags, tagQuery]
  );

  const validateProduct = () => {
    const errors = [];
    const info = productState.productInfo;

    if (!info.name?.trim()) errors.push("Product name is required.");
    if (!info.description?.trim()) errors.push("Product description is required.");
    if (!info.highlights?.trim()) errors.push("Product highlights are required.");
    if (!info.brandId && !brandQuery.trim()) errors.push("Brand is required.");
    if (!info.categoryId) errors.push("Category is required.");
    if (productState.images.length === 0) errors.push("At least one product image is required.");

    productState.variants.forEach((variant, index) => {
      if (!variant.name?.trim()) errors.push(`Variant ${index + 1}: name is required.`);
      if (!variant.sellerSKU?.trim()) errors.push(`Variant ${index + 1}: seller SKU is required.`);
      if ((selectedSubCategory?.hasColors ?? false) && !variant.color?.trim()) errors.push(`Variant ${index + 1}: color is required.`);
      if ((selectedSubCategory?.hasSizes ?? false) && !variant.size?.trim()) errors.push(`Variant ${index + 1}: size is required.`);
      if ((selectedSubCategory?.hasStyles ?? false) && !variant.style?.trim()) errors.push(`Variant ${index + 1}: style is required.`);
      if (Number(variant.stockQuantity) < 0) errors.push(`Variant ${index + 1}: stock quantity cannot be negative.`);
      if (Number(variant.weight) <= 0) errors.push(`Variant ${index + 1}: weight must be greater than zero.`);
      variant.pricingTiers.forEach((tier, tierIndex) => {
        if (Number(tier.minQuantity) < 1) errors.push(`Variant ${index + 1} tier ${tierIndex + 1}: minimum quantity must be at least 1.`);
        if (Number(tier.pricePerUnit) <= 0) errors.push(`Variant ${index + 1} tier ${tierIndex + 1}: price per unit must be greater than zero.`);
      });
    });

    if (!productState.specification.mainMaterial?.trim()) errors.push("Main material is required.");
    if (!productState.specification.productionCountry?.trim()) errors.push("Production country is required.");
    return errors;
  };

  const buildFormData = () => {
    const formData = new FormData();
    const info = productState.productInfo;

    (info.tags || []).forEach((tag, index) => formData.append(`Tags[${index}]`, tag));
    formData.append("Id", productState.id || info.id || "");
    formData.append("Name", info.name || "");
    formData.append("Description", info.description || "");
    formData.append("Highlights", info.highlights || "");
    formData.append("Weight", info.weight || "");
    formData.append("PrimaryColor", info.primaryColor || "");
    formData.append("Condition", String(info.condition ?? 0));
    formData.append("StockQuantity", String(info.stockQuantity || 0));
    formData.append("IsAvailable", String(info.isAvailable ?? true));
    formData.append("IsAvailableOnRequest", String(info.isAvailableOnRequest ?? false));
    formData.append("BrandId", info.brandId || "");
    formData.append("BrandName", info.brandId ? "" : brandQuery.trim());
    formData.append("CategoryId", info.categoryId || "");
    formData.append("SubCategoryId", info.subCategoryId || "");
    formData.append("ProductTypeId", info.productTypeId || "");
    formData.append("ProductSubTypeId", info.productSubTypeId || "");

    productState.images.forEach((image) => {
      if (image.file) formData.append("imageFiles", image.file);
      else if (image.imageUrl) {
        formData.append("ImageUrls", image.imageUrl);
        formData.append("existingImages", image.imageUrl);
      }
    });

    productState.variants.forEach((variant, index) => {
      formData.append(`VariantsDto[${index}].Id`, variant.id || "");
      formData.append(`VariantsDto[${index}].Color`, variant.color || "");
      formData.append(`VariantsDto[${index}].Size`, variant.size || "");
      formData.append(`VariantsDto[${index}].Style`, variant.style || "");
      formData.append(`VariantsDto[${index}].Name`, variant.name || "");
      formData.append(`VariantsDto[${index}].SellerSKU`, variant.sellerSKU || "");
      formData.append(`VariantsDto[${index}].BarCode`, variant.barCode || "");
      formData.append(`VariantsDto[${index}].Weight`, String(variant.weight || 0));
      formData.append(`VariantsDto[${index}].StockQuantity`, String(variant.stockQuantity || 0));
      formData.append(`VariantsDto[${index}].SaleStartDate`, variant.saleStartDate || "");
      formData.append(`VariantsDto[${index}].SaleEndDate`, variant.saleEndDate || "");

      variant.images.forEach((image) => {
        if (image.file) formData.append(`VariantsDto[${index}].imageFiles`, image.file);
        else if (image.id) formData.append(`VariantsDto[${index}].ExistingImageIds`, image.id);
      });

      variant.pricingTiers.forEach((tier, tierIndex) => {
        formData.append(`VariantsDto[${index}].PricingTiersDto[${tierIndex}].Id`, tier.id || "");
        formData.append(`VariantsDto[${index}].PricingTiersDto[${tierIndex}].MinQuantity`, String(tier.minQuantity || 1));
        formData.append(`VariantsDto[${index}].PricingTiersDto[${tierIndex}].PricePerUnit`, String(tier.pricePerUnit || 0));
        formData.append(`VariantsDto[${index}].PricingTiersDto[${tierIndex}].PricePerUnitGlobal`, String(tier.pricePerUnitGlobal || 0));
      });
    });

    const spec = productState.specification;
    formData.append("SpecificationsDto.Certification", spec.certification || "");
    formData.append("SpecificationsDto.MainMaterial", spec.mainMaterial || "");
    formData.append("SpecificationsDto.MaterialFamily", spec.materialFamily || "");
    formData.append("SpecificationsDto.Model", spec.model || "");
    formData.append("SpecificationsDto.ProductionCountry", spec.productionCountry || "");
    formData.append("SpecificationsDto.ProductLine", spec.productLine || "");
    formData.append("SpecificationsDto.WarrantyDuration", spec.warrantyDuration || "");
    formData.append("SpecificationsDto.WarrantyType", spec.warrantyType || "");
    formData.append("SpecificationsDto.YouTubeId", normalizeYouTubeId(spec.youTubeId || ""));
    formData.append("SpecificationsDto.Nafdac", spec.nafdac || "");
    formData.append("SpecificationsDto.Fda", spec.fda || "");
    formData.append("SpecificationsDto.Disclaimer", spec.disclaimer || "");
    formData.append("SpecificationsDto.FromTheManufacturer", spec.fromTheManufacturer || "");
    formData.append("SpecificationsDto.WhatIsInTheBox", spec.whatIsInTheBox || "");
    formData.append("SpecificationsDto.ProductWarranty", spec.productWarranty || "");
    formData.append("SpecificationsDto.WarrantyAddress", spec.warrantyAddress || "");

    return formData;
  };

  const submitProduct = async (shouldSubmitForReview) => {
    const validationErrors = validateProduct();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setSubmitting(true);
    try {
      const formData = buildFormData();
      const saveResponse = isEdit
        ? await requestHandler.putForm(`${endpointsPath.vendor}/products/${productId}`, formData, true)
        : await requestHandler.postForm(`${endpointsPath.vendor}/products`, formData, true);

      if (saveResponse.statusCode >= 300 || !saveResponse.result?.data?.id) {
        toast.error(saveResponse.result?.message || "Unable to save product");
        return;
      }

      const savedId = saveResponse.result.data.id;
      if (shouldSubmitForReview) {
        const reviewResponse = await requestHandler.post(`${endpointsPath.vendor}/products/${savedId}/submit-for-review`, {}, true);
        if (reviewResponse.statusCode >= 300) {
          toast.error(reviewResponse.result?.message || "Product saved, but review submission failed");
          router.push(`/customer/vendor/products/${savedId}/edit`);
          return;
        }

        toast.success(isEdit ? "Product updated and sent for admin review" : "Product created and sent for admin review");
        router.push("/customer/vendor/products");
        router.refresh();
        return;
      }

      toast.success(isEdit ? "Product draft updated" : "Product draft created");
      router.push(`/customer/vendor/products/${savedId}/edit`);
      router.refresh();
    } catch (error) {
      console.error("vendor product save failed", error);
      toast.error("Unable to save product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[32px] border border-slate-200 bg-white/85">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <FiLoader className="animate-spin text-base text-orange-500" />
          Loading product workspace...
        </div>
      </div>
    );
  }

  return (
    <ProductWorkspaceShell
      eyebrow="Vendor Products"
      title={isEdit ? "Update product" : "Create product"}
      description="Use the same structured product workflow as the admin catalog, then send your changes for moderation before they go live."
      actions={
        <>
          <Link href="/customer/vendor/products" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600"><FiArrowLeft />Back to products</Link>
          {renderSubmitButtons()}
        </>
      }
      stats={[
        { label: "Steps", value: 3, helper: "Guided flow" },
        { label: "Status", value: productState.reviewStatus?.replace(/([a-z])([A-Z])/g, "$1 $2") || "Draft", helper: isEdit ? "Current" : "New" },
        { label: "Variants", value: productState.variants.length, helper: "Configured" },
      ]}
    >
      <div className="relative">
        {submitting ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[32px] bg-slate-900/30 backdrop-blur-[2px]">
            <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-4 shadow-xl">
              <FiLoader className="animate-spin text-lg text-orange-500" />
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {isEdit ? "Saving product changes" : "Saving product draft"}
                </div>
                <div className="text-xs text-slate-500">
                  {submitting ? "Please wait while we upload files and submit your changes." : ""}
                </div>
              </div>
            </div>
          </div>
        ) : null}

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ProductSurface className="h-fit lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-slate-900">Product workflow</h2>
          <p className="mt-2 text-sm text-slate-600">Build the product in sections, then send it for review before it can be published by an admin.</p>
          <div className="mt-6 space-y-2">
            {[{ id: 1, title: "Product info", icon: FiFileText }, { id: 2, title: "Variants", icon: FiPackage }, { id: 3, title: "Specification", icon: FiEdit3 }].map((step) => {
              const Icon = step.icon;
              return (
                <button key={step.id} type="button" onClick={() => scrollToStep(step.id)} className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${activeStep === step.id ? "border-orange-200 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${activeStep === step.id ? "bg-[#f97316] text-white" : "bg-slate-100 text-slate-500"}`}><Icon /></span>
                  <span>{step.title}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Moderation status</div>
            <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${reviewTone[productState.reviewStatus] || reviewTone.Draft}`}>{productState.reviewStatus?.replace(/([a-z])([A-Z])/g, "$1 $2") || "Draft"}</div>
            {productState.reviewRejectionReason ? <p className="mt-3 text-sm text-rose-700">Reason: {productState.reviewRejectionReason}</p> : null}
          </div>
        </ProductSurface>

        <div className="space-y-6">
          <ProductSurface id="vendor-product-step-1" className="scroll-mt-24">
            <div ref={stepOneRef}>
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f97316] text-sm font-semibold text-white">1</span><h2 className="text-xl font-semibold text-slate-900">Product info</h2></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Product name</span><input value={productState.productInfo.name} onChange={(event) => setProductInfo({ name: event.target.value })} className={inputClass} /></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Brand</span><input value={brandQuery} onChange={(event) => { setBrandQuery(event.target.value); setProductInfo({ brandId: "" }); }} list="vendor-product-brands" className={inputClass} placeholder="Search brand or type a new brand" /><datalist id="vendor-product-brands">{filteredBrands.map((brand) => <option key={brand.id} value={brand.name} />)}</datalist><div className="flex flex-wrap gap-2">{filteredBrands.slice(0, 8).map((brand) => <button key={brand.id} type="button" onClick={() => { setProductInfo({ brandId: brand.id }); setBrandQuery(brand.name); }} className={`rounded-full px-3 py-1 text-xs font-medium ${productState.productInfo.brandId === brand.id ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>{brand.name}</button>)}</div></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Category</span><select value={productState.productInfo.categoryId} onChange={(event) => setProductInfo({ categoryId: event.target.value, subCategoryId: "", productTypeId: "", productSubTypeId: "" })} className={inputClass}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Sub category</span><select value={productState.productInfo.subCategoryId} onChange={(event) => setProductInfo({ subCategoryId: event.target.value, productTypeId: "", productSubTypeId: "" })} className={inputClass} disabled={!selectedCategory}><option value="">Select sub category</option>{selectedCategory?.subCategories?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Product type</span><select value={productState.productInfo.productTypeId} onChange={(event) => setProductInfo({ productTypeId: event.target.value, productSubTypeId: "" })} className={inputClass} disabled={!selectedSubCategory}><option value="">Select product type</option>{selectedSubCategory?.productTypes?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Product sub type</span><select value={productState.productInfo.productSubTypeId} onChange={(event) => setProductInfo({ productSubTypeId: event.target.value })} className={inputClass} disabled={!selectedProductType}><option value="">Select product sub type</option>{selectedProductType?.productSubTypes?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">Description</span><textarea value={productState.productInfo.description} onChange={(event) => setProductInfo({ description: event.target.value })} className={textAreaClass} /></label>
              <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">Highlights</span><textarea value={productState.productInfo.highlights} onChange={(event) => setProductInfo({ highlights: event.target.value })} className={textAreaClass} /></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Primary color</span><input value={productState.productInfo.primaryColor} onChange={(event) => setProductInfo({ primaryColor: event.target.value })} list="vendor-product-colors" className={inputClass} /><datalist id="vendor-product-colors">{productColors.map((color) => <option key={color} value={color} />)}</datalist></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Condition</span><select value={String(productState.productInfo.condition ?? 0)} onChange={(event) => setProductInfo({ condition: Number(event.target.value) })} className={inputClass}>{productConditionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Available for sale</span><select value={String(productState.productInfo.isAvailable)} onChange={(event) => setProductInfo({ isAvailable: event.target.value === "true" })} className={inputClass}><option value="true">Yes</option><option value="false">No</option></select></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Available on request</span><select value={String(productState.productInfo.isAvailableOnRequest ?? false)} onChange={(event) => setProductInfo({ isAvailableOnRequest: event.target.value === "true" })} className={inputClass}><option value="false">No</option><option value="true">Yes</option></select></label>
            </div>
            <div className="mt-6">
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Tags</span><input value={tagQuery} onChange={(event) => setTagQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && tagQuery.trim()) { event.preventDefault(); addTag(tagQuery); } }} list="vendor-product-tags" className={inputClass} placeholder="Search tags or type a custom one" /><datalist id="vendor-product-tags">{filteredTags.map((tag) => <option key={tag.id} value={tag.name} />)}</datalist></label>
              <div className="mt-3 flex flex-wrap gap-2">{filteredTags.slice(0, 8).map((tag) => <button key={tag.id} type="button" onClick={() => addTag(tag.name)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{tag.name}</button>)}{tagQuery ? <button type="button" onClick={() => addTag(tagQuery)} className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">Add "{tagQuery}"</button> : null}</div>
              {productState.productInfo.tags.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{productState.productInfo.tags.map((tag) => <button key={tag} type="button" onClick={() => removeTag(tag)} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{tag} x</button>)}</div> : null}
            </div>
            <div className="mt-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-900">Product images</h3><p className="text-sm text-slate-500">Upload up to 10 images.</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"><FiSave />Add images<input type="file" accept="image/*" multiple className="hidden" onChange={(event) => addProductImages(event.target.files)} /></label></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{productState.images.map((image, index) => <div key={`${image.imageUrl || image.preview || index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><img src={image.preview || image.imageUrl} alt={`Product image ${index + 1}`} className="h-40 w-full object-cover" /><div className="flex items-center justify-between px-3 py-2"><span className="text-xs font-medium text-slate-500">{index === 0 ? "Primary" : `Image ${index + 1}`}</span><button type="button" onClick={() => removeProductImage(index)} className="text-xs font-semibold text-rose-600">Remove</button></div></div>)}</div></div>
            </div>
          </ProductSurface>

          <ProductSurface id="vendor-product-step-2" className="scroll-mt-24">
            <div ref={stepTwoRef}>
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f97316] text-sm font-semibold text-white">2</span><h2 className="text-xl font-semibold text-slate-900">Variants</h2></div>
            <div className="mt-6 space-y-6">{productState.variants.map((variant, variantIndex) => <div key={variant.id || variantIndex} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold text-slate-900">Variant {variantIndex + 1}</h3>{productState.variants.length > 1 ? <button type="button" onClick={() => removeVariant(variantIndex)} className="text-sm font-semibold text-rose-600">Remove variant</button> : null}</div><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Variant name</span><input value={variant.name} onChange={(event) => updateVariant(variantIndex, { name: event.target.value })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Seller SKU</span><input value={variant.sellerSKU} onChange={(event) => updateVariant(variantIndex, { sellerSKU: event.target.value })} className={inputClass} /></label>{selectedSubCategory?.hasColors ? <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Color</span><input value={variant.color} onChange={(event) => updateVariant(variantIndex, { color: event.target.value })} list={`vendor-variant-colors-${variantIndex}`} className={inputClass} /><datalist id={`vendor-variant-colors-${variantIndex}`}>{productColors.map((color) => <option key={color} value={color} />)}</datalist></label> : null}{selectedSubCategory?.hasSizes ? <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Size</span><input value={variant.size} onChange={(event) => updateVariant(variantIndex, { size: event.target.value })} className={inputClass} /></label> : null}{selectedSubCategory?.hasStyles ? <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Style</span><input value={variant.style} onChange={(event) => updateVariant(variantIndex, { style: event.target.value })} className={inputClass} /></label> : null}<label className="space-y-2"><span className="text-sm font-medium text-slate-700">Bar code</span><input value={variant.barCode} onChange={(event) => updateVariant(variantIndex, { barCode: event.target.value })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Stock quantity</span><input type="number" min="0" value={variant.stockQuantity} onChange={(event) => updateVariant(variantIndex, { stockQuantity: Number(event.target.value) })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Weight (grams)</span><input type="number" min="0" value={variant.weight} onChange={(event) => updateVariant(variantIndex, { weight: Number(event.target.value) })} className={inputClass} /></label></div><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><div><h4 className="text-sm font-semibold text-slate-900">Pricing tiers</h4><p className="text-sm text-slate-500">Every update still goes back through admin review.</p></div><button type="button" onClick={() => addPricingTier(variantIndex)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Add tier</button></div><div className="mt-4 space-y-3">{variant.pricingTiers.map((tier, tierIndex) => <div key={`${tier.id || "new"}-${tierIndex}`} className="grid gap-3 rounded-2xl border border-slate-200 p-3 md:grid-cols-4"><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Min quantity</span><input type="number" min="1" value={tier.minQuantity} onChange={(event) => updatePricingTier(variantIndex, tierIndex, { minQuantity: Number(event.target.value) })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Price per unit</span><input type="number" min="0" step="0.01" value={tier.pricePerUnit} onChange={(event) => updatePricingTier(variantIndex, tierIndex, { pricePerUnit: Number(event.target.value) })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Global price</span><input type="number" min="0" step="0.01" value={tier.pricePerUnitGlobal} onChange={(event) => updatePricingTier(variantIndex, tierIndex, { pricePerUnitGlobal: Number(event.target.value) })} className={inputClass} /></label><div className="flex items-end"><button type="button" disabled={variant.pricingTiers.length === 1} onClick={() => removePricingTier(variantIndex, tierIndex)} className="w-full rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 disabled:opacity-50">Remove</button></div></div>)}</div></div><div className="mt-6"><div className="flex items-center justify-between gap-3"><div><h4 className="text-sm font-semibold text-slate-900">Variant images</h4><p className="text-sm text-slate-500">Upload up to 5 images.</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"><FiSave />Add images<input type="file" accept="image/*" multiple className="hidden" onChange={(event) => addVariantImages(variantIndex, event.target.files)} /></label></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{variant.images.map((image, imageIndex) => <div key={`${image.imageUrl || image.preview || imageIndex}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><img src={image.preview || image.imageUrl} alt={`Variant ${variantIndex + 1} image ${imageIndex + 1}`} className="h-32 w-full object-cover" /><div className="flex items-center justify-between px-3 py-2"><span className="text-xs font-medium text-slate-500">{imageIndex === 0 ? "Primary" : `Image ${imageIndex + 1}`}</span><button type="button" onClick={() => removeVariantImage(variantIndex, imageIndex)} className="text-xs font-semibold text-rose-600">Remove</button></div></div>)}</div></div></div>)}<button type="button" onClick={addVariant} className="rounded-2xl border border-dashed border-orange-300 px-4 py-3 text-sm font-semibold text-orange-700">Add another variant</button></div>
            </div>
          </ProductSurface>

          <ProductSurface id="vendor-product-step-3" className="scroll-mt-24">
            <div ref={stepThreeRef}>
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f97316] text-sm font-semibold text-white">3</span><h2 className="text-xl font-semibold text-slate-900">Specification</h2></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Certification</span><input value={productState.specification.certification} onChange={(event) => setSpecification({ certification: event.target.value })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Main material</span><input value={productState.specification.mainMaterial} onChange={(event) => setSpecification({ mainMaterial: event.target.value })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Material family</span><input value={productState.specification.materialFamily} onChange={(event) => setSpecification({ materialFamily: event.target.value })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Model</span><input value={productState.specification.model} onChange={(event) => setSpecification({ model: event.target.value })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Production country</span><input value={productState.specification.productionCountry} onChange={(event) => setSpecification({ productionCountry: event.target.value })} list="vendor-product-countries" className={inputClass} /><datalist id="vendor-product-countries">{countryOptions.map((country) => <option key={country} value={country} />)}</datalist></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Product line</span><input value={productState.specification.productLine} onChange={(event) => setSpecification({ productLine: event.target.value })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Warranty duration</span><input value={productState.specification.warrantyDuration} onChange={(event) => setSpecification({ warrantyDuration: event.target.value })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Warranty type</span><input value={productState.specification.warrantyType} onChange={(event) => setSpecification({ warrantyType: event.target.value })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">YouTube ID</span><input value={productState.specification.youTubeId} onChange={(event) => setSpecification({ youTubeId: event.target.value })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">NAFDAC</span><input value={productState.specification.nafdac} onChange={(event) => setSpecification({ nafdac: event.target.value })} className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">FDA</span><input value={productState.specification.fda} onChange={(event) => setSpecification({ fda: event.target.value })} className={inputClass} /></label><label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">Disclaimer</span><textarea value={productState.specification.disclaimer} onChange={(event) => setSpecification({ disclaimer: event.target.value })} className={textAreaClass} /></label><label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">From the manufacturer</span><textarea value={productState.specification.fromTheManufacturer} onChange={(event) => setSpecification({ fromTheManufacturer: event.target.value })} className={textAreaClass} /></label><label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">What is in the box</span><textarea value={productState.specification.whatIsInTheBox} onChange={(event) => setSpecification({ whatIsInTheBox: event.target.value })} className={textAreaClass} /></label><label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">Product warranty</span><textarea value={productState.specification.productWarranty} onChange={(event) => setSpecification({ productWarranty: event.target.value })} className={textAreaClass} /></label><label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">Warranty address</span><textarea value={productState.specification.warrantyAddress} onChange={(event) => setSpecification({ warrantyAddress: event.target.value })} className={textAreaClass} /></label></div>
            </div>
          </ProductSurface>

          <ProductSurface>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Ready to save?</h3>
                <p className="text-sm text-slate-500">Keep a draft or submit the latest changes for admin review.</p>
              </div>
              {renderSubmitButtons("bottom")}
            </div>
          </ProductSurface>
        </div>
      </div>
      </div>
    </ProductWorkspaceShell>
  );
}

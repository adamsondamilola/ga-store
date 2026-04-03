import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import PageTitleComponent from "../PageTitle";
import Pagination from "../Pagination";
import requestHandler from "../../utils/requestHandler";
import endpointsPath from "../../constants/EndpointsPath";
import ClassStyle from "../../class-styles";
import { useDebounce } from "../../hooks/useDebounce";

const createInitialForm = () => ({
  id: "",
  title: "",
  subtitle: "",
  badgeText: "",
  startDate: "",
  endDate: "",
  isActive: true,
  showOnHomepage: true,
  ctaText: "",
  ctaLink: "",
  backgroundImageUrl: "",
  displayOrder: 0,
  products: [],
});

const toInputDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const statusTone = {
  Live: "bg-green-100 text-green-700",
  Scheduled: "bg-blue-100 text-blue-700",
  Expired: "bg-red-100 text-red-700",
  Inactive: "bg-gray-100 text-gray-700",
};

export default function LimitedOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(createInitialForm());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm);
  const debouncedProductSearch = useDebounce(productSearch);

  const assignedProductIds = useMemo(
    () => new Set(form.products.map((item) => item.productId)),
    [form.products]
  );

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.limitedOffer}?searchTerm=${encodeURIComponent(
          debouncedSearchTerm || ""
        )}&pageNumber=${page}&pageSize=${pageSize}`,
        true
      );

      if (response.statusCode === 200) {
        setOffers(response.result?.data || []);
        setTotalPages(response.result?.totalPages || 1);
      } else {
        toast.error(response.result?.message || "Failed to load limited offers");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load limited offers");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.product}/admin?searchTerm=${encodeURIComponent(
          debouncedProductSearch || ""
        )}&pageNumber=1&pageSize=20&isAvailable=true&isApproved=true`,
        true
      );

      if (response.statusCode === 200) {
        setProductResults(response.result?.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [debouncedSearchTerm, page, pageSize]);

  useEffect(() => {
    if (formOpen) {
      fetchProducts();
    }
  }, [debouncedProductSearch, formOpen]);

  const openCreate = () => {
    setForm(createInitialForm());
    setProductSearch("");
    setProductResults([]);
    setFormOpen(true);
  };

  const openEdit = async (id) => {
    try {
      const response = await requestHandler.get(`${endpointsPath.limitedOffer}/${id}`, true);
      if (response.statusCode !== 200) {
        toast.error(response.result?.message || "Failed to load offer");
        return;
      }

      const data = response.result?.data;
      setForm({
        id: data.id,
        title: data.title || "",
        subtitle: data.subtitle || "",
        badgeText: data.badgeText || "",
        startDate: toInputDateTime(data.startDate),
        endDate: toInputDateTime(data.endDate),
        isActive: !!data.isActive,
        showOnHomepage: !!data.showOnHomepage,
        ctaText: data.ctaText || "",
        ctaLink: data.ctaLink || "",
        backgroundImageUrl: data.backgroundImageUrl || "",
        displayOrder: data.displayOrder || 0,
        products: (data.assignedProducts || []).map((item, index) => ({
          id: item.id,
          productId: item.productId,
          displayOrder: item.displayOrder ?? index,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          price: item.price,
          originalPrice: item.originalPrice,
        })),
      });
      setFormOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load offer");
    }
  };

  const closeForm = () => {
    setFormOpen(false);
    setForm(createInitialForm());
  };

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const addProduct = (product) => {
    if (assignedProductIds.has(product.id)) return;

    setForm((current) => ({
      ...current,
      products: [
        ...current.products,
        {
          productId: product.id,
          displayOrder: current.products.length,
          name: product.name,
          description: product.description,
          imageUrl: product.images?.[0]?.imageUrl,
          price: product.variantsDto?.[0]?.pricingTiersDto?.[0]?.pricePerUnit || 0,
          originalPrice:
            product.variantsDto?.[0]?.pricingTiersDto?.[0]?.pricePerUnitGlobal ||
            product.variantsDto?.[0]?.pricingTiersDto?.[0]?.pricePerUnit ||
            0,
        },
      ],
    }));
  };

  const removeProduct = (productId) => {
    setForm((current) => ({
      ...current,
      products: current.products
        .filter((item) => item.productId !== productId)
        .map((item, index) => ({ ...item, displayOrder: index })),
    }));
  };

  const moveProduct = (productId, direction) => {
    setForm((current) => {
      const index = current.products.findIndex((item) => item.productId === productId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.products.length) {
        return current;
      }

      const products = [...current.products];
      [products[index], products[nextIndex]] = [products[nextIndex], products[index]];
      return {
        ...current,
        products: products.map((item, itemIndex) => ({ ...item, displayOrder: itemIndex })),
      };
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error("Start and end dates are required");
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error("End date must be after start date");
      return;
    }
    if (form.products.length === 0) {
      toast.error("Assign at least one product");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        badgeText: form.badgeText.trim(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        isActive: form.isActive,
        showOnHomepage: form.showOnHomepage,
        ctaText: form.ctaText.trim(),
        ctaLink: form.ctaLink.trim(),
        backgroundImageUrl: form.backgroundImageUrl.trim(),
        displayOrder: Number(form.displayOrder) || 0,
        products: form.products.map((item, index) => ({
          id: item.id || null,
          productId: item.productId,
          displayOrder: index,
        })),
      };

      const response = form.id
        ? await requestHandler.put(`${endpointsPath.limitedOffer}/${form.id}`, payload, true)
        : await requestHandler.post(endpointsPath.limitedOffer, payload, true);

      if (response.statusCode === 200 || response.statusCode === 201) {
        toast.success(response.result?.message || "Limited offer saved");
        closeForm();
        fetchOffers();
      } else {
        toast.error(response.result?.message || "Failed to save limited offer");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save limited offer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this limited offer?")) return;
    const response = await requestHandler.deleteReq(`${endpointsPath.limitedOffer}/${id}`, true);
    if (response.statusCode === 200) {
      toast.success(response.result?.message || "Limited offer deleted");
      fetchOffers();
    } else {
      toast.error(response.result?.message || "Delete failed");
    }
  };

  const handleToggleActive = async (id) => {
    const response = await requestHandler.patch(`${endpointsPath.limitedOffer}/${id}/toggle-active`, {}, true);
    if (response.statusCode === 200) {
      toast.success(response.result?.message || "Offer updated");
      fetchOffers();
    } else {
      toast.error(response.result?.message || "Unable to update offer");
    }
  };

  return (
    <div className="p-4">
      <PageTitleComponent title="Limited Offers" />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search limited offers..."
          className="border px-3 py-2 rounded w-full md:w-80"
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setPage(1);
          }}
        />
        <button type="button" className={ClassStyle.button} onClick={openCreate}>
          + New Limited Offer
        </button>
      </div>

      <div className="relative overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Homepage</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{offer.title}</div>
                  <div className="text-xs text-gray-500">{offer.badgeText || "No badge"}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[offer.status] || statusTone.Inactive}`}>
                    {offer.status}
                  </span>
                </td>
                <td className="px-4 py-3">{new Date(offer.startDate).toLocaleString()}</td>
                <td className="px-4 py-3">{new Date(offer.endDate).toLocaleString()}</td>
                <td className="px-4 py-3">{offer.showOnHomepage ? "Visible" : "Hidden"}</td>
                <td className="px-4 py-3">{offer.productCount}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button type="button" className="mr-3 text-blue-600" onClick={() => openEdit(offer.id)}>Edit</button>
                  <button type="button" className="mr-3 text-amber-600" onClick={() => handleToggleActive(offer.id)}>
                    {offer.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button type="button" className="text-red-600" onClick={() => handleDelete(offer.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!loading && offers.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No limited offers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="w-full max-w-6xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{form.id ? "Edit Limited Offer" : "Create Limited Offer"}</h2>
              <button type="button" className="text-gray-500" onClick={closeForm}>Close</button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div><label className={ClassStyle.label1}>Title</label><input className={ClassStyle.input} value={form.title} onChange={(e) => setField("title", e.target.value)} /></div>
                  <div><label className={ClassStyle.label1}>Badge Text</label><input className={ClassStyle.input} value={form.badgeText} onChange={(e) => setField("badgeText", e.target.value)} /></div>
                </div>
                <div><label className={ClassStyle.label1}>Subtitle</label><textarea className={ClassStyle.input} rows="3" value={form.subtitle} onChange={(e) => setField("subtitle", e.target.value)} /></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><label className={ClassStyle.label1}>Start Date/Time</label><input type="datetime-local" className={ClassStyle.input} value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} /></div>
                  <div><label className={ClassStyle.label1}>End Date/Time</label><input type="datetime-local" className={ClassStyle.input} value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} /></div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div><label className={ClassStyle.label1}>CTA Text</label><input className={ClassStyle.input} value={form.ctaText} onChange={(e) => setField("ctaText", e.target.value)} /></div>
                  <div className="md:col-span-2"><label className={ClassStyle.label1}>CTA Link</label><input className={ClassStyle.input} value={form.ctaLink} onChange={(e) => setField("ctaLink", e.target.value)} /></div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><label className={ClassStyle.label1}>Background Image URL</label><input className={ClassStyle.input} value={form.backgroundImageUrl} onChange={(e) => setField("backgroundImageUrl", e.target.value)} /></div>
                  <div><label className={ClassStyle.label1}>Display Order</label><input type="number" className={ClassStyle.input} value={form.displayOrder} onChange={(e) => setField("displayOrder", e.target.value)} /></div>
                </div>
                <div className="flex flex-wrap gap-6 rounded-lg border border-gray-200 p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.isActive} onChange={(e) => setField("isActive", e.target.checked)} /> Active</label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.showOnHomepage} onChange={(e) => setField("showOnHomepage", e.target.checked)} /> Show on homepage</label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-3 font-semibold text-gray-900">Assign Products</h3>
                  <input
                    type="text"
                    placeholder="Search approved products..."
                    className={ClassStyle.input}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  <div className="mt-3 max-h-56 overflow-y-auto rounded border">
                    {productsLoading && <div className="p-3 text-sm text-gray-500">Searching products...</div>}
                    {!productsLoading && productResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        disabled={assignedProductIds.has(product.id)}
                        className="flex w-full items-center justify-between border-b px-3 py-3 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.description || "No description"}</div>
                        </div>
                        <span className="text-xs font-semibold text-blue-600">{assignedProductIds.has(product.id) ? "Added" : "Add"}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-3 font-semibold text-gray-900">Assigned Products</h3>
                  <div className="space-y-3">
                    {form.products.map((item, index) => (
                      <div key={item.productId} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900">{index + 1}. {item.name}</div>
                            <div className="text-xs text-gray-500">{item.description || "No description"}</div>
                          </div>
                          <button type="button" className="text-red-600 text-sm" onClick={() => removeProduct(item.productId)}>Remove</button>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => moveProduct(item.productId, -1)}>Move Up</button>
                          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => moveProduct(item.productId, 1)}>Move Down</button>
                        </div>
                      </div>
                    ))}
                    {form.products.length === 0 && <div className="text-sm text-gray-500">No products assigned yet.</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="rounded border border-gray-300 px-4 py-2" onClick={closeForm}>Cancel</button>
              <button type="button" className={ClassStyle.button} onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : form.id ? "Update Offer" : "Create Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

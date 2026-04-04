import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import requestHandler from "../../utils/requestHandler";
import endpointsPath from "../../constants/EndpointsPath";

const emptyFaq = { question: "", answer: "" };

const initialForm = {
  siteName: "GaStore",
  siteDescription: "",
  footerDescription: "",
  logoUrl: "",
  phoneNumber: "",
  whatsAppNumber: "",
  infoEmail: "",
  supportEmail: "",
  officeAddress: "",
  businessHours: "",
  faqItems: [emptyFaq],
  privacyPolicyContent: "",
  termsOfServiceContent: "",
  shippingPolicyContent: "",
  refundPolicyContent: "",
};

export default function WebsiteContent({ section = "all" }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(`${endpointsPath.websiteContent}/admin`, true);
      if (response.statusCode === 200 && response.result?.data) {
        const data = response.result.data;
        setForm({
          ...initialForm,
          ...data,
          faqItems: Array.isArray(data.faqItems) && data.faqItems.length > 0 ? data.faqItems : [emptyFaq],
        });
      } else {
        toast.error(response.result?.message || "Failed to load website content");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load website content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateFaq = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      faqItems: prev.faqItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addFaq = () => {
    setForm((prev) => ({ ...prev, faqItems: [...prev.faqItems, { ...emptyFaq }] }));
  };

  const removeFaq = (index) => {
    setForm((prev) => ({
      ...prev,
      faqItems: prev.faqItems.length === 1 ? [{ ...emptyFaq }] : prev.faqItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        faqItems: form.faqItems.filter(
          (item) => item.question.trim() || item.answer.trim()
        ),
      };

      const response = await requestHandler.put(`${endpointsPath.websiteContent}/admin`, payload, true);

      if (response.statusCode === 200 && response.result?.data) {
        toast.success(response.result?.message || "Website content updated");
        const data = response.result.data;
        setForm({
          ...initialForm,
          ...data,
          faqItems: Array.isArray(data.faqItems) && data.faqItems.length > 0 ? data.faqItems : [emptyFaq],
        });
      } else {
        toast.error(response.result?.message || "Unable to update website content");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to update website content");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-lg border bg-white p-6 text-sm text-gray-500">Loading website content...</div>;
  }

  const showWebsiteSettings = section === "all" || section === "settings";
  const showFaqs = section === "all" || section === "faqs";
  const showPolicies = section === "all" || section === "policies";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {showWebsiteSettings ? (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {section === "settings" ? "Website Settings" : "Website Content"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage storefront contact details, logo, FAQs, and policy page content from one place.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input className="rounded border px-3 py-2" placeholder="Site name" value={form.siteName} onChange={(e) => updateField("siteName", e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Logo URL" value={form.logoUrl} onChange={(e) => updateField("logoUrl", e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Phone number" value={form.phoneNumber} onChange={(e) => updateField("phoneNumber", e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="WhatsApp number" value={form.whatsAppNumber} onChange={(e) => updateField("whatsAppNumber", e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Info email" value={form.infoEmail} onChange={(e) => updateField("infoEmail", e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Support email" value={form.supportEmail} onChange={(e) => updateField("supportEmail", e.target.value)} />
          <input className="rounded border px-3 py-2 md:col-span-2" placeholder="Business hours" value={form.businessHours} onChange={(e) => updateField("businessHours", e.target.value)} />
          <textarea className="rounded border px-3 py-2 md:col-span-2" rows={3} placeholder="Site description" value={form.siteDescription} onChange={(e) => updateField("siteDescription", e.target.value)} />
          <textarea className="rounded border px-3 py-2 md:col-span-2" rows={3} placeholder="Footer description" value={form.footerDescription} onChange={(e) => updateField("footerDescription", e.target.value)} />
          <textarea className="rounded border px-3 py-2 md:col-span-2" rows={3} placeholder="Office address" value={form.officeAddress} onChange={(e) => updateField("officeAddress", e.target.value)} />
        </div>
      </div>
      ) : null}

      {showFaqs ? (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">FAQs</h2>
            <p className="mt-1 text-sm text-gray-500">Add, edit, or remove questions shown on the FAQ page.</p>
          </div>
          <button type="button" onClick={addFaq} className="rounded bg-black px-4 py-2 text-sm text-white">
            Add FAQ
          </button>
        </div>

        <div className="space-y-4">
          {form.faqItems.map((faq, index) => (
            <div key={`faq-${index}`} className="rounded-lg border p-4">
              <div className="grid grid-cols-1 gap-3">
                <input
                  className="rounded border px-3 py-2"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => updateFaq(index, "question", e.target.value)}
                />
                <textarea
                  className="rounded border px-3 py-2"
                  rows={4}
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) => updateFaq(index, "answer", e.target.value)}
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      ) : null}

      {showPolicies ? (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Policies and Legal Content</h2>
        <p className="mt-1 text-sm text-gray-500">
          Use <code>## Heading</code> on a new line to create section titles on the storefront pages.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <textarea className="rounded border px-3 py-2" rows={10} placeholder="Privacy policy content" value={form.privacyPolicyContent} onChange={(e) => updateField("privacyPolicyContent", e.target.value)} />
          <textarea className="rounded border px-3 py-2" rows={10} placeholder="Terms of service content" value={form.termsOfServiceContent} onChange={(e) => updateField("termsOfServiceContent", e.target.value)} />
          <textarea className="rounded border px-3 py-2" rows={10} placeholder="Shipping policy content" value={form.shippingPolicyContent} onChange={(e) => updateField("shippingPolicyContent", e.target.value)} />
          <textarea className="rounded border px-3 py-2" rows={10} placeholder="Refund policy content" value={form.refundPolicyContent} onChange={(e) => updateField("refundPolicyContent", e.target.value)} />
        </div>
      </div>
      ) : null}

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="rounded bg-black px-5 py-2 text-white disabled:bg-gray-300">
          {saving ? "Saving..." : "Save Website Content"}
        </button>
      </div>
    </form>
  );
}

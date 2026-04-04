import { useMemo, useRef, useState } from 'react';
import { FiCheckCircle, FiLayers, FiList, FiPackage, FiShield } from 'react-icons/fi';

const ProductDetailsSection = ({ productData, selectedVariant }) => {
  const [activeSection, setActiveSection] = useState('description');

  const sectionRefs = {
    description: useRef(null),
    highlights: useRef(null),
    specifications: useRef(null),
    whatsInBox: useRef(null)
  };

  const highlightItems = useMemo(
    () =>
      (productData?.highlights || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    [productData?.highlights]
  );

  const specificationItems = useMemo(() => {
    const specs = productData?.specifications || {};
    const items = [];

    if (selectedVariant?.weight) {
      items.push({
        label: 'Weight',
        value: `${(selectedVariant.weight / 1000).toFixed(1)} kg`
      });
    }

    if (selectedVariant?.sellerSKU) {
      items.push({ label: 'SKU', value: selectedVariant.sellerSKU });
    }

    if (specs.mainMaterial) {
      items.push({ label: 'Material', value: specs.mainMaterial });
    }

    if (specs.model) {
      items.push({ label: 'Model', value: specs.model });
    }

    if (specs.productionCountry) {
      items.push({ label: 'Production Country', value: specs.productionCountry });
    }

    if (specs.warrantyDuration) {
      items.push({ label: 'Warranty', value: specs.warrantyDuration });
    }

    if (specs.certification) {
      items.push({ label: 'Certification', value: specs.certification });
    }

    if (specs.nafdac) {
      items.push({ label: 'NAFDAC', value: specs.nafdac });
    }

    if (specs.fdaApproved) {
      items.push({ label: 'FDA Status', value: 'Approved' });
    }

    return items;
  }, [productData?.specifications, selectedVariant]);

  const infoCards = useMemo(() => {
    const cards = [];
    const specs = productData?.specifications || {};

    if (highlightItems.length > 0) {
      cards.push({
        title: 'Top highlights',
        body: `${highlightItems.length} quick points to help you review this item faster.`,
        icon: FiList
      });
    }

    if (specificationItems.length > 0) {
      cards.push({
        title: 'Technical details',
        body: `${specificationItems.length} specification${specificationItems.length > 1 ? 's' : ''} available for this product.`,
        icon: FiLayers
      });
    }

    if (specs.whatIsInTheBox) {
      cards.push({
        title: "What's included",
        body: 'See what comes in the package before placing your order.',
        icon: FiPackage
      });
    }

    if (specs.warrantyDuration || specs.disclaimer) {
      cards.push({
        title: 'Warranty and care',
        body: 'Important policy and after-purchase notes are listed below.',
        icon: FiShield
      });
    }

    return cards;
  }, [highlightItems.length, productData?.specifications, specificationItems.length]);

  const availableSections = useMemo(() => {
    const sections = [
      { key: 'description', label: 'Description' },
      { key: 'highlights', label: 'Highlights', visible: highlightItems.length > 0 },
      { key: 'specifications', label: 'Specifications', visible: specificationItems.length > 0 },
      {
        key: 'whatsInBox',
        label: "What's Included",
        visible: Boolean(productData?.specifications?.whatIsInTheBox)
      }
    ];

    return sections.filter((section) => section.visible !== false);
  }, [highlightItems.length, productData?.specifications?.whatIsInTheBox, specificationItems.length]);

  const scrollToSection = (section) => {
    setActiveSection(section);
    sectionRefs[section]?.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <section className="mt-8 rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm lg:p-7">
      <div className="flex flex-col gap-6 border-b border-gray-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Product Details</p>
          <h2 className="mt-3 text-2xl font-semibold text-gray-950 sm:text-[2rem]">A clearer look at what you&apos;re buying</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-[15px]">
            We organized the product information into a cleaner layout so the key details, features, and included items are easier to review.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[430px]">
          {infoCards.slice(0, 4).map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.title} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm">
                    <Icon className="text-base" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{card.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-gray-500">{card.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sticky top-0 z-10 -mx-2 mt-5 overflow-x-auto bg-white/95 px-2 py-2 backdrop-blur">
        <div className="flex min-w-max gap-2">
          {availableSections.map((section) => (
            <button
              key={section.key}
              onClick={() => scrollToSection(section.key)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeSection === section.key
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-8">
        <div ref={sectionRefs.description} className="scroll-mt-24 rounded-3xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm">
              <FiList className="text-lg" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-950">Description</h3>
              <p className="text-sm text-gray-500">Overview of the product and intended use.</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white p-5 text-sm leading-7 text-gray-700 shadow-sm whitespace-break-spaces">
            {productData?.description || 'No description available for this product yet.'}
          </div>
        </div>

        {highlightItems.length > 0 && (
          <div ref={sectionRefs.highlights} className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                <FiCheckCircle className="text-lg" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-950">Highlights</h3>
                <p className="text-sm text-gray-500">The main selling points at a glance.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {highlightItems.map((item, index) => (
                <div key={`${item}-${index}`} className="flex gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm">
                    <FiCheckCircle className="text-sm" />
                  </div>
                  <p className="text-sm leading-6 text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {specificationItems.length > 0 && (
          <div ref={sectionRefs.specifications} className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                <FiLayers className="text-lg" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-950">Specifications</h3>
                <p className="text-sm text-gray-500">Core technical and product information.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {specificationItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">{item.label}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>

            {productData?.specifications?.disclaimer && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Disclaimer</p>
                <p className="mt-2 text-sm leading-6 text-amber-900">{productData.specifications.disclaimer}</p>
              </div>
            )}
          </div>
        )}

        {productData?.specifications?.whatIsInTheBox && (
          <div ref={sectionRefs.whatsInBox} className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                <FiPackage className="text-lg" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-950">What&apos;s Included</h3>
                <p className="text-sm text-gray-500">Everything expected inside the package.</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-gray-50 p-5 text-sm leading-7 text-gray-700 whitespace-break-spaces">
              {productData.specifications.whatIsInTheBox}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductDetailsSection;

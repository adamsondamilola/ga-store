"use client";
import { useState, useMemo, useEffect } from "react";
import formatNumberToCurrency from "@/utils/numberToMoney";
import { Cancel } from "@mui/icons-material";

export default function PickupModal({
  selectedAddress,
  deliveryLocations,
  handlePickupSelect,
  totalCartWeightKg,
  setIsPickupModalOpen,
  isDoorStepDelivery,
}) {
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [searchPickup, setSearchPickup] = useState("");

  useEffect(() => {
    if (selectedAddress?.state) {
      setStateFilter(selectedAddress.state);
    }
  }, [selectedAddress, isDoorStepDelivery]);

  const calcFee = (loc) => {
    if (!loc?.priceByWeights || !Array.isArray(loc.priceByWeights)) {
      return Number(loc?.pickupDeliveryAmount || 0);
    }

    const weight = parseFloat(totalCartWeightKg);
    if (isNaN(weight)) return Number(loc?.pickupDeliveryAmount || 0);

    const sortedTiers = [...loc.priceByWeights].sort(
      (a, b) => (a.minWeight || 0) - (b.minWeight || 0)
    );

    for (const tier of sortedTiers) {
      const min = parseFloat(tier.minWeight);
      const max = parseFloat(tier.maxWeight);
      if (isNaN(min) || isNaN(max)) continue;
      if (weight >= min && weight <= max) {
        return Number(tier.price || 0);
      }
    }

    for (const tier of sortedTiers) {
      const min = parseFloat(tier.minWeight);
      if (!isNaN(min) && weight < min) {
        return Number(tier.price || 0);
      }
    }

    const lastTier = sortedTiers[sortedTiers.length - 1];
    return Number(lastTier?.price || loc?.pickupDeliveryAmount || 0);
  };

  const eligibleLocations = useMemo(() => {
    if (!Array.isArray(deliveryLocations)) return [];

    return deliveryLocations.filter((loc) => {
      if (!loc?.isActive || !loc?.shippingProvider) return false;

      if (isDoorStepDelivery) {
        return !!loc.isHomeDelivery;
      }

      return !loc.isHomeDelivery && !!loc.pickupAddress;
    });
  }, [deliveryLocations, isDoorStepDelivery]);

  const availableStates = [...new Set(eligibleLocations.map((l) => l.state).filter(Boolean))];

  const availableCities = [
    ...new Set(
      eligibleLocations
        .filter((l) => !stateFilter || l.state === stateFilter)
        .map((l) => l.city)
        .filter(Boolean)
    ),
  ];

  const availableProviders = [
    ...new Set(eligibleLocations.map((l) => l.shippingProvider).filter(Boolean)),
  ];

  const filteredLocations = useMemo(() => {
    return eligibleLocations.filter((loc) => {
      if (stateFilter && loc?.state !== stateFilter) return false;
      if (cityFilter && loc?.city !== cityFilter) return false;
      if (providerFilter && loc?.shippingProvider !== providerFilter) return false;

      if (searchPickup) {
        const s = searchPickup.toLowerCase();
        return (
          loc?.city?.toLowerCase()?.includes(s) ||
          loc?.pickupAddress?.toLowerCase()?.includes(s) ||
          loc?.shippingProvider?.toLowerCase()?.includes(s) ||
          loc?.state?.toLowerCase()?.includes(s)
        );
      }

      return true;
    });
  }, [eligibleLocations, stateFilter, cityFilter, providerFilter, searchPickup]);

  const clearAllFilters = () => {
    setStateFilter(selectedAddress?.state || "");
    setCityFilter("");
    setProviderFilter("");
    setSearchPickup("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {!isDoorStepDelivery ? "Select Pickup Location" : "Select Home Delivery Provider"}
          </h3>
          <button
            onClick={() => setIsPickupModalOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none text-xl"
          >
            <Cancel />
          </button>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                disabled
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">All States</option>
                {availableStates.map((s, i) => (
                  <option key={i} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                disabled={availableCities.length === 0}
              >
                <option value="">All Cities</option>
                {availableCities.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Provider</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setProviderFilter("")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  providerFilter === ""
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Providers
              </button>
              {availableProviders.map((provider, i) => (
                <button
                  key={i}
                  onClick={() => setProviderFilter(providerFilter === provider ? "" : provider)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    providerFilter === provider
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {provider}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Locations</label>
            <input
              type="text"
              placeholder="Search by city, address, or provider..."
              value={searchPickup}
              onChange={(e) => setSearchPickup(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {filteredLocations.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <div>
              <span className="text-sm font-medium text-gray-700">
                {filteredLocations.length} location{filteredLocations.length !== 1 ? "s" : ""} found
              </span>
            </div>

            {(stateFilter || cityFilter || providerFilter || searchPickup) && (
              <button
                onClick={clearAllFilters}
                className="text-blue-600 text-sm font-medium hover:underline hover:text-blue-800 whitespace-nowrap"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        <div className="space-y-3 mb-6">
          {filteredLocations.length > 0 ? (
            filteredLocations.map((loc) => (
              <div
                key={loc?.id || `${loc?.shippingProvider}-${loc?.city}`}
                onClick={() => handlePickupSelect(loc)}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{loc?.shippingProvider || "Unknown Provider"}</p>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        {loc?.city || "Unknown City"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {loc?.pickupAddress || "Doorstep Delivery"}
                    </p>
                    {loc?.state && <p className="text-xs text-gray-500">{loc.state}</p>}
                    {loc?.phoneNumber && (
                      <p className="text-xs text-gray-500 mt-1">Phone: {loc.phoneNumber}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <p className="font-bold text-green-700 text-lg whitespace-nowrap">
                      {formatNumberToCurrency(calcFee(loc))}
                    </p>
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2">
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
              <p className="text-lg font-medium mb-2">No matching locations found</p>
              <p className="text-sm">Try adjusting your city, provider, or search term</p>
              <button
                onClick={clearAllFilters}
                className="mt-3 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsPickupModalOpen(false)}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

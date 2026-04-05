"use client";

import endpointsPath from "@/constants/EndpointsPath";
import nigeriaStates from "@/constants/NigeriaStates";
import AppStrings from "@/constants/Strings";
import requestHandler from "@/utils/requestHandler";
import formatNumberToCurrency from "@/utils/numberToMoney";
import { Add, CheckCircle, DeleteOutline, Edit, Refresh } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiHome,
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiPlus,
  FiStar,
  FiTruck,
  FiUser,
} from "react-icons/fi";
import { DashboardPageShell, DashboardPanel, DashboardStatCard } from "../PageShell";

const emptyAddress = {
  fullName: "",
  phoneNumber: "",
  address: "",
  city: "",
  state: "",
  country: "Nigeria",
};

const formFieldClassName =
  "w-full rounded-2xl border border-[#e8ded6] bg-[#fcfaf8] px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#f3c9a7] focus:bg-white";

export default function Addresses() {
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [pickupAddress, setPickupAddress] = useState(null);

  const availableCities = useMemo(() => {
    if (!newAddress.state) {
      return [];
    }

    const stateData = nigeriaStates.find(
      (state) => state.name.toLowerCase() === newAddress.state.toLowerCase()
    );

    return stateData ? stateData.subdivision : [];
  }, [newAddress.state]);

  const hasRequiredFields =
    Boolean(newAddress.fullName) &&
    Boolean(newAddress.phoneNumber) &&
    Boolean(newAddress.address) &&
    Boolean(newAddress.state) &&
    Boolean(newAddress.city);

  const fetchUserAddresses = async (showToast = false) => {
    try {
      setLoading(true);
      setRefreshing(true);

      const resp = await requestHandler.get(`${endpointsPath.userDeliveryAddress}`, true);
      if (resp.statusCode === 200) {
        const addresses = resp.result?.data || [];
        setDeliveryAddresses(addresses);

        const primary = addresses.find((address) => address.isPrimary);
        const nextSelectedAddress =
          addresses.find((address) => address.id === selectedAddress?.id) ||
          primary ||
          addresses[0] ||
          null;

        setSelectedAddress(nextSelectedAddress);

        if (showToast) {
          toast.success("Addresses refreshed");
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDeliveryFee = async () => {
    if (!selectedAddress?.state || !selectedAddress?.city) {
      setDeliveryFee(0);
      setPickupAddress(null);
      return;
    }

    try {
      const url = `${endpointsPath.deliveryLocation}/get-by-state-city?State=${selectedAddress.state}&City=${selectedAddress.city}`;
      const response = await requestHandler.get(url, true);

      if (response.statusCode === 200 && response.result?.data) {
        const data = response.result.data;
        setDeliveryFee(data.doorDeliveryAmount || 0);
        setPickupAddress(data.pickupAddress || null);
      }
    } catch (error) {
      console.error("Delivery fee fetch failed:", error);
    }
  };

  useEffect(() => {
    fetchUserAddresses();
  }, []);

  useEffect(() => {
    fetchDeliveryFee();
  }, [selectedAddress]);

  const resetForm = () => {
    setNewAddress(emptyAddress);
    setIsEditing(false);
  };

  const closeForm = () => {
    setShowAddAddress(false);
    resetForm();
  };

  const handleAddAddress = async () => {
    if (!hasRequiredFields) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await requestHandler.post(
        endpointsPath.userDeliveryAddress,
        newAddress,
        true
      );

      if (response.statusCode < 202) {
        toast.success(isEditing ? "Address updated successfully" : "Address added successfully");
        await fetchUserAddresses();
        closeForm();
      } else {
        toast.error(response.result?.message || "Failed to save address");
      }
    } catch (error) {
      console.error("Failed to save address:", error);
      toast.error(AppStrings.internalServerError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      const response = await requestHandler.deleteReq(
        `${endpointsPath.userDeliveryAddress}/${id}`,
        true
      );

      if (response.statusCode === 200) {
        toast.success("Address deleted successfully");

        const updatedAddresses = deliveryAddresses.filter((address) => address.id !== id);
        setDeliveryAddresses(updatedAddresses);

        if (selectedAddress?.id === id) {
          const primary = updatedAddresses.find((address) => address.isPrimary);
          setSelectedAddress(primary || updatedAddresses[0] || null);
        }
      } else {
        toast.error(response.message || "Failed to delete address");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Something went wrong");
    }
  };

  const updatePrimaryAddress = async (addressId) => {
    try {
      const response = await requestHandler.put(
        `${endpointsPath.userDeliveryAddress}/${addressId}/set-primary`,
        {},
        true
      );

      if (response.statusCode === 200) {
        await fetchUserAddresses();
        toast.success("Primary address updated");
      }
    } catch (error) {
      console.error("Failed to update primary address:", error);
    }
  };

  const beginCreateAddress = () => {
    resetForm();
    setShowAddAddress(true);
  };

  const beginEditAddress = (address) => {
    setNewAddress({
      ...address,
      country: address.country || "Nigeria",
    });
    setIsEditing(true);
    setShowAddAddress(true);
  };

  const stats = [
    {
      label: "Saved addresses",
      value: deliveryAddresses.length,
      note: deliveryAddresses.length === 1 ? "One location ready" : "Delivery locations on file",
      icon: FiMapPin,
      tone: "bg-[linear-gradient(135deg,#fff1e5,#fffaf5)] text-gray-950",
    },
    {
      label: "Primary city",
      value: selectedAddress?.city || "Not set",
      note: selectedAddress ? selectedAddress.state : "Choose an address to highlight",
      icon: FiStar,
      tone: "bg-white text-gray-950",
    },
    {
      label: "Delivery fee",
      value: selectedAddress ? formatNumberToCurrency(deliveryFee || 0) : "Unavailable",
      note: pickupAddress || "Shown for the selected address",
      icon: FiTruck,
      tone: "bg-[#1f2937] text-white",
    },
  ];

  const renderAddressForm = () => (
    <DashboardPanel className="h-fit">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
            {isEditing ? "Edit Address" : "New Address"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-950">
            {isEditing ? "Update delivery details" : "Add a delivery location"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Save a clean, complete address so checkout and delivery estimates stay accurate.
          </p>
        </div>

        <button
          type="button"
          onClick={closeForm}
          className="rounded-full border border-[#e8ded6] px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-[#fcfaf8]"
        >
          Cancel
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className={formFieldClassName}
              value={newAddress.fullName}
              onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="text"
              placeholder="08012345678"
              className={formFieldClassName}
              value={newAddress.phoneNumber}
              onChange={(e) => setNewAddress({ ...newAddress, phoneNumber: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Street Address</label>
          <input
            type="text"
            placeholder="123 Main Street, Apartment 4B"
            className={formFieldClassName}
            value={newAddress.address}
            onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">State</label>
            <select
              value={newAddress.state}
              onChange={(e) => {
                const state = e.target.value;
                setNewAddress({
                  ...newAddress,
                  state,
                  city: "",
                });
              }}
              className={formFieldClassName}
            >
              <option value="">Select state</option>
              {nigeriaStates.map((state) => (
                <option key={state.name} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">City / LGA</label>
            <select
              value={newAddress.city}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
              className={formFieldClassName}
              disabled={!newAddress.state}
            >
              <option value="">Select city</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#f0e6dc] bg-[#fcfaf8] px-4 py-3 text-sm text-gray-600">
          <span className="font-medium text-gray-900">Country:</span> Nigeria
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={handleAddAddress}
            disabled={!hasRequiredFields || isLoading}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
              !hasRequiredFields || isLoading
                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                : "bg-gray-950 text-white hover:bg-black"
            }`}
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <FiPlus />
            )}
            {isEditing ? "Update address" : "Save address"}
          </button>

          <button
            type="button"
            onClick={closeForm}
            className="inline-flex items-center justify-center rounded-full border border-[#e8ded6] px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-[#fcfaf8]"
          >
            Cancel
          </button>
        </div>
      </div>
    </DashboardPanel>
  );

  return (
    <DashboardPageShell
      eyebrow="Addresses"
      title="Delivery addresses"
      description="Manage the places you ship to, update your primary delivery point, and keep checkout details consistent."
      actions={
        <>
          <button
            type="button"
            onClick={() => fetchUserAddresses(true)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Refresh className={refreshing ? "animate-spin" : ""} fontSize="small" />
            Refresh
          </button>

          <button
            type="button"
            onClick={beginCreateAddress}
            className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
          >
            <Add fontSize="small" />
            Add address
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map((card) => (
            <DashboardStatCard
              key={card.label}
              label={card.label}
              value={card.value}
              note={card.note}
              icon={card.icon}
              tone={card.tone}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <DashboardPanel className="overflow-hidden p-0">
            <div className="border-b border-[#f1e8df] px-5 py-5 md:px-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
                    Saved Locations
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-gray-950">Your address book</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Choose a primary address or keep multiple destinations ready for future orders.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-[#fff6ef] px-4 py-2 text-sm font-medium text-[#c2410c]">
                  <FiNavigation />
                  {selectedAddress ? "Primary selected" : "No primary address"}
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">
              {loading ? (
                <div className="flex min-h-[260px] items-center justify-center">
                  <div className="inline-flex items-center gap-3 rounded-full bg-[#fcfaf8] px-4 py-3 text-sm font-medium text-gray-600">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d6c3b2] border-t-[#c2410c]" />
                    Loading addresses
                  </div>
                </div>
              ) : deliveryAddresses.length > 0 ? (
                <div className="space-y-4">
                  {deliveryAddresses.map((address) => {
                    const isSelected = selectedAddress?.id === address.id;

                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => {
                          setSelectedAddress(address);
                          updatePrimaryAddress(address.id);
                        }}
                        className={`w-full rounded-[28px] border px-5 py-5 text-left transition ${
                          isSelected
                            ? "border-[#f3c9a7] bg-[linear-gradient(135deg,#fff7f1,#fffdf9)] shadow-[0_16px_40px_rgba(240,108,35,0.10)]"
                            : "border-[#ece4db] bg-white hover:border-[#f0dacc] hover:bg-[#fcfaf8]"
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1e5] text-[#c2410c]">
                                <FiHome />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-950">{address.fullName}</h3>
                                <p className="text-sm text-gray-500">
                                  {address.city}, {address.state}
                                </p>
                              </div>
                              {address.isPrimary ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-semibold text-[#047857]">
                                  <CheckCircle fontSize="inherit" />
                                  Primary
                                </span>
                              ) : null}
                            </div>

                            <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                              <div className="flex items-start gap-3 rounded-2xl bg-[#fcfaf8] px-4 py-3">
                                <FiMapPin className="mt-0.5 text-[#c2410c]" />
                                <span>{address.address}</span>
                              </div>
                              <div className="flex items-start gap-3 rounded-2xl bg-[#fcfaf8] px-4 py-3">
                                <FiPhone className="mt-0.5 text-[#c2410c]" />
                                <span>{address.phoneNumber}</span>
                              </div>
                              <div className="flex items-start gap-3 rounded-2xl bg-[#fcfaf8] px-4 py-3">
                                <FiNavigation className="mt-0.5 text-[#c2410c]" />
                                <span>
                                  {address.city}, {address.state}
                                </span>
                              </div>
                              <div className="flex items-start gap-3 rounded-2xl bg-[#fcfaf8] px-4 py-3">
                                <FiUser className="mt-0.5 text-[#c2410c]" />
                                <span>{address.country || "Nigeria"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                beginEditAddress(address);
                              }}
                              className="inline-flex items-center gap-2 rounded-full border border-[#e8ded6] bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-[#fcfaf8]"
                            >
                              <Edit fontSize="small" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(address.id);
                              }}
                              className="inline-flex items-center gap-2 rounded-full border border-[#f6d2d2] bg-[#fff5f5] px-4 py-2 text-sm font-medium text-[#b91c1c] transition hover:bg-[#feecec]"
                            >
                              <DeleteOutline fontSize="small" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-[#e6d8cb] bg-[#fcfaf8] px-6 py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#c2410c] shadow-sm">
                    <FiMapPin size={26} />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-gray-950">No delivery addresses yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                    Add your first delivery location to speed up checkout and get accurate shipping details.
                  </p>
                  <button
                    type="button"
                    onClick={beginCreateAddress}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
                  >
                    <FiPlus />
                    Add your first address
                  </button>
                </div>
              )}
            </div>
          </DashboardPanel>

          {showAddAddress ? (
            renderAddressForm()
          ) : (
            <DashboardPanel className="h-fit">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
                Selected Address
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-950">
                {selectedAddress ? "Delivery summary" : "Ready when you are"}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {selectedAddress
                  ? "Review the currently selected address and add another one anytime."
                  : "Create a saved location to start building your address book."}
              </p>

              {selectedAddress ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-[26px] border border-[#f0dacc] bg-[linear-gradient(135deg,#fff9f5,#fff2e8)] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#c2410c] shadow-sm">
                        <FiNavigation />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-950">{selectedAddress.fullName}</h3>
                        <p className="text-sm text-gray-600">
                          {selectedAddress.address}, {selectedAddress.city}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-[#ece4db] bg-[#fcfaf8] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Phone
                      </p>
                      <p className="mt-2 text-sm text-gray-700">{selectedAddress.phoneNumber}</p>
                    </div>

                    <div className="rounded-2xl border border-[#ece4db] bg-[#fcfaf8] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Delivery Fee
                      </p>
                      <p className="mt-2 text-sm font-semibold text-gray-900">
                        {formatNumberToCurrency(deliveryFee || 0)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#ece4db] bg-[#fcfaf8] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Pickup Address
                      </p>
                      <p className="mt-2 text-sm text-gray-700">
                        {pickupAddress || "Pickup point will appear when available for this location."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => beginEditAddress(selectedAddress)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e8ded6] px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-[#fcfaf8]"
                  >
                    <Edit fontSize="small" />
                    Edit selected address
                  </button>
                </div>
              ) : (
                <div className="mt-6 rounded-[26px] border border-dashed border-[#e6d8cb] bg-[#fcfaf8] px-5 py-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#c2410c] shadow-sm">
                    <FiHome size={24} />
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    Your selected address details will appear here once you save one.
                  </p>
                </div>
              )}
            </DashboardPanel>
          )}
        </div>
      </div>
    </DashboardPageShell>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import endpointsPath from '@/constants/EndpointsPath';
import requestHandler from '@/utils/requestHandler';
import toast from 'react-hot-toast';
import { useFlutterwave } from 'flutterwave-react-v3';
import { usePaystackPayment } from 'react-paystack';
import AppStrings from '@/constants/Strings';

export function useCheckout() {
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentGateway, setPaymentGateway] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [manualPaymentAccounts, setManualPaymentAccounts] = useState([]);
  const [manualProofFile, setManualProofFile] = useState(null);
  const [manualSelectedBankAccountId, setManualSelectedBankAccountId] = useState('');
  const [manualPaymentReference, setManualPaymentReference] = useState('');
  const [manualCustomerNote, setManualCustomerNote] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [deliveryLocations, setDeliveryLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [hideAddresses, setHideAddresses] = useState(true);
  const [orderNote, setOrderNote] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editableAddress, setEditableAddress] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasDoorStepDeliveryOption, setHasDoorStepDeliveryOption] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [deliveryFee, setDeliveryFee] = useState(0.0);
  const [deliveryFee2, setDeliveryFee2] = useState(0.0);
  const [isDoorStepDelivery, setIsDoorStepDelivery] = useState(null);
  const [pickupAddress, setPickupAddress] = useState(null);
  const [pickupAddressPhone, setPickupAddressPhone] = useState(null);
  const [pickupAddressState, setPickupAddressState] = useState(null);
  const [pickupAddressCity, setPickupAddressCity] = useState(null);
  const [shippingProvider, setShippingProvider] = useState(null);
  const [isHomeDelivery, setIsHomeDelivery] = useState(false);
  const [shippingCity, setShippingCity] = useState(null);

  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);

  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [searchPickup, setSearchPickup] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');

  const [locations, setLocations] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [vat, setVat] = useState(0.0);
  const [isVatAvailable, setIsVatAvailable] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [subTotalAfterDiscount, setSubTotalAfterDiscount] = useState(0);
  const [totalAfterDiscount, setTotalAfterDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isCouponSuccessful, setIsCouponSuccessful] = useState(false);
  const [deliveryMethodSelected, setDeliveryMethodSelected] = useState(false);

  const [initializeTransaction, setInitializeTransaction] = useState(null);
  const [orderId, setOrderId] = useState("");
  const orderIdRef = useRef("");


  // ---------- helpers ----------
  const calcFeeFromWeights = (weights, totalWeightKg) => {
  if (!weights || !weights.length) return 0;
  
  const weight = Number(totalWeightKg);
  if (isNaN(weight)) return 0;
  
  // Sort weights by minWeight ascending
  const sortedWeights = [...weights]
    .map(w => ({
      ...w,
      minWeight: Number(w.minWeight),
      maxWeight: Number(w.maxWeight),
      price: Number(w.price)
    }))
    .filter(w => !isNaN(w.minWeight) && !isNaN(w.maxWeight))
    .sort((a, b) => a.minWeight - b.minWeight);
  
  if (sortedWeights.length === 0) return 0;
  
  //Try to find exact match first
  const exactMatch = sortedWeights.find(w => 
    weight >= Math.min(w.minWeight, w.maxWeight) && 
    weight <= Math.max(w.minWeight, w.maxWeight)
  );
  
  if (exactMatch) return exactMatch.price;
  
  //If weight is less than smallest minWeight, use first tier
  if (weight < sortedWeights[0].minWeight) {
    return sortedWeights[0].price;
  }
  
  //If weight is between tiers (gap), use the next tier with minWeight > weight
  for (let i = 0; i < sortedWeights.length; i++) {
    if (weight < sortedWeights[i].minWeight) {
      return sortedWeights[i].price;
    }
  }
  
  //If weight exceeds all tiers, use the last tier
  return sortedWeights[sortedWeights.length - 1].price;
};

  const getTieredPrice = (tiers, quantity) => {
    if (!tiers?.length) return 0;
    const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
    return (
      sorted.find((t) => quantity >= t.minQuantity)?.pricePerUnit ||
      sorted[sorted.length - 1]?.pricePerUnit ||
      0
    );
  };

  // total cart weight
  const totalCartWeightKg = useMemo(
    () =>
      cartItems.reduce(
        (sum, i) => sum + (i.weight || 100) / 1000,
        0
      ),
    [cartItems]
  );

  // subtotal / tax / totals
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems]
  );

  const shippingFee = isDoorStepDelivery ? deliveryFee : deliveryFee2;
  const vatPer = !isVatAvailable ? 0.0 : parseFloat(vat) / 100;
  const tax = (subtotal + shippingFee) * vatPer;
  const total = subtotal + shippingFee + tax;

  const discountedSubtotal = discountPercentage > 0
    ? subtotal - (subtotal * discountPercentage) / 100
    : subtotal;

  const totalAfterDiscountCalc =
    discountedSubtotal + shippingFee + tax;

  // ---------- API: initial fetches ----------

  const fetchAllDeliveryLocations = async () => {

    // Check if selectedAddress is available before proceeding
      if (!selectedAddress || !selectedAddress.state || !selectedAddress.city) {
          // Option 1: Clear previous results and exit
          setDeliveryLocations([]);
          return;
          // Option 2: Or just exit silently and keep old results: return;
      }
  
      //setLoading(true);
      try {
        if(selectedAddress.deliveryLocationId){
          const url = `${endpointsPath.deliveryLocation}/${selectedAddress.deliveryLocationId}`;
          const resp = await requestHandler.get(url, true);
  
          if (resp.statusCode === 200 && resp.result?.data) {
              //update selected pickup address
              const loc = resp.result.data;

              const pickupWeightFee = calcFeeFromWeights(
      loc.priceByWeights,
      totalCartWeightKg
    );
    const fee =
      pickupWeightFee > 0
        ? pickupWeightFee
        : 0;

              setShippingProvider(loc.shippingProvider || null);
              setShippingCity(loc.city || null);

              if(!loc){
                setPickupAddress(null);
                setDeliveryFee2(0);
              }

              if(loc && !loc.isHomeDelivery){
                setIsDoorStepDelivery(isDoorStepDelivery !== null ? isDoorStepDelivery : false);
                setPickupAddress(loc.pickupAddress || null);
              setPickupAddressPhone(loc.phoneNumber || null);
              setPickupAddressCity(loc.city || null);
              setIsHomeDelivery(loc.isHomeDelivery || false);
              setPickupAddressState(loc.state || null);
              setDeliveryFee2(fee);
              setDeliveryFee(0);
              }else{
                setIsDoorStepDelivery(isDoorStepDelivery !== null ? isDoorStepDelivery : true);
                setPickupAddress(null);
                setDeliveryFee(fee);
                setDeliveryFee2(0);
              }
              setSelectedLocation(loc);

          } else {
              //setDeliveryLocations([]);
              setPickupAddress(null);
              setDeliveryFee2(0);
              setDeliveryFee(0);
          }
        }
  
        const state = encodeURIComponent(selectedAddress.state);
          
          const url = `${endpointsPath.deliveryLocation}?searchTerm=&pageNumber=1&pageSize=500&state=${state}&isHomeDelivery=${isDoorStepDelivery? 'true' : 'false' }`;
          
          const resp = await requestHandler.get(url, true);
          
          if (resp.statusCode === 200 && resp.result?.data?.length) {
              setDeliveryLocations(resp.result.data);
              setTotalPages(resp.result.totalPages || 1);
              
          } else {
              setDeliveryLocations([]);
          }
      } catch (e) {
          console.error(e);
          toast.error('Failed to load delivery locations');
          setDeliveryLocations([]); // Clear on error
      } finally {
          //setLoading(false);
      }
  };

  const fetchAllHomeDeliveryOptions = async () => {
    setLoading(true);
    try {
      const state = encodeURIComponent(selectedAddress.state);
      const url2 = `${endpointsPath.deliveryLocation}?searchTerm=&pageNumber=1&pageSize=500&state=${state}&isHomeDelivery=true`;
          const resp2 = await requestHandler.get(url2, true);
          if(resp2.statusCode === 200 && resp2.result?.data?.length > 0){
            setHasDoorStepDeliveryOption(true);
          }else{
            setHasDoorStepDeliveryOption(null);
          }
        } catch (e) {
          console.error(e);
          //toast.error('Failed to load delivery locations');
        } finally { 
          setLoading(false);
        }
  }
  
  const fetchVats = async () => {
    setLoading(true);
    try {
      let url = `${endpointsPath.vat}?pageNumber=${page}&pageSize=10`;
      const response = await requestHandler.get(url, true);
      if (response.statusCode === 200 && response.result?.data) {
        setVat(response.result.data[0].percentage || 7.5);
        setIsVatAvailable(response.result.data[0].isActive || false);
        setTotalPages(response.result.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load vat');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      let url = `${endpointsPath.deliveryLocation}?searchTerm=${searchTerm}&pageNumber=${page}&pageSize=100`;
      const response = await requestHandler.get(url, true);
      if (response.statusCode === 200 && response.result?.data) {
        setLocations(response.result.data);
        setTotalPages(response.result.totalPages || 1);

        const uniqueStates = [...new Set(response.result.data.map((location) => location.state))];
        const allCities = response.result.data.map((location) => location.city);

        setStates(uniqueStates);
        setCities(allCities);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load delivery locations');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAddresses = async () => {
    try {
      setLoading(true);
      const resp = await requestHandler.get(
        `${endpointsPath.userDeliveryAddress}`,
        true
      );
      if (resp.statusCode === 200) {
        setDeliveryAddresses(resp.result.data);
        const primary = resp.result.data.find((addr) => addr.isPrimary);
        setSelectedAddress(primary || resp.result.data[0] || null);
      } else {
        // redirect to login
        localStorage.setItem('redirect_url', `/checkout`);
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoggedInUser = async () => {
    try {
      const resp = await requestHandler.get(
        `${endpointsPath.auth}/logged-in-user-details`,
        true
      );
      if (resp.statusCode === 200) {
        setUserId(resp.result.data?.id);
        setUser(resp.result.data || null);
      }
    } catch (error) {
      console.error('logged-in-user-details failed', error);
    }
  };

  const fetchManualPaymentAccounts = async () => {
    try {
      const resp = await requestHandler.get(
        `${endpointsPath.manualPayment}/accounts`,
        true
      );

      if (resp.statusCode === 200) {
        setManualPaymentAccounts(resp.result?.data || []);
      }
    } catch (error) {
      console.error('manual payment accounts failed', error);
    }
  };

  const applyPaymentMethodSelection = (methods) => {
    const enabledMethods = methods || [];
    const enabledGateways = enabledMethods.filter((item) => item.isGateway && item.isEnabled);
    const walletMethod = enabledMethods.find((item) => item.methodKey === 'commission' && item.isEnabled);
    const manualMethod = enabledMethods.find((item) => item.methodKey === 'manual' && item.isEnabled);
    const defaultGateway =
      enabledGateways.find((item) => item.isDefaultGateway) ||
      enabledGateways[0] ||
      null;

    const isCurrentSelectionValid =
      (paymentMethod === 'credit-card' &&
        enabledGateways.some((item) => item.methodKey === paymentGateway)) ||
      (paymentMethod === 'wallet' && Boolean(walletMethod)) ||
      (paymentMethod === 'manual' && Boolean(manualMethod));

    if (isCurrentSelectionValid) {
      if (
        paymentMethod === 'credit-card' &&
        !enabledGateways.some((item) => item.methodKey === paymentGateway && item.isDefaultGateway) &&
        defaultGateway &&
        !paymentGateway
      ) {
        setPaymentGateway(defaultGateway.methodKey);
      }
      return;
    }

    if (defaultGateway) {
      setPaymentMethod('credit-card');
      setPaymentGateway(defaultGateway.methodKey);
      return;
    }

    if (walletMethod) {
      setPaymentMethod('wallet');
      setPaymentGateway('');
      return;
    }

    if (manualMethod) {
      setPaymentMethod('manual');
      setPaymentGateway('');
      return;
    }

    setPaymentMethod('');
    setPaymentGateway('');
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await requestHandler.get(
        `${endpointsPath.checkout}/payment-methods`,
        true
      );

      if (response.statusCode === 200) {
        const methods = response.result?.data || [];
        setPaymentMethods(methods);
        applyPaymentMethodSelection(methods);
      }
    } catch (error) {
      console.error('payment methods failed', error);
    }
  };

  // ---------- effects ----------
  useEffect(() => {
    fetchAllDeliveryLocations();
    fetchVats();
    fetchLocations();
    fetchUserAddresses();
    fetchLoggedInUser();
    fetchManualPaymentAccounts();
    fetchPaymentMethods();

    // load cart
    const storedCart = typeof window !== 'undefined'
      ? localStorage.getItem('cart')
      : null;

    if (storedCart) {
      const parsed = JSON.parse(storedCart);
      const itemsWithPrices = parsed.map((item) => ({
        ...item,
        unitPrice: getTieredPrice(item.pricingTiers, item.quantity),
      }));
      setCartItems(itemsWithPrices);
    }
  }, []);

  useEffect(() => {
    fetchAllDeliveryLocations();
}, [selectedAddress, isDoorStepDelivery]);

  useEffect(() => {
  fetchAllHomeDeliveryOptions();
}, [selectedAddress]);

  useEffect(() => {
    if (paymentMethods.length > 0) {
      applyPaymentMethodSelection(paymentMethods);
    }
  }, [paymentMethods]);

  // update delivery fee whenever address / locations / cart change
  useEffect(() => {
    if (!selectedAddress || deliveryLocations.length === 0) return;

    const loc = deliveryLocations.find((l) => {
  // Ensure both values exist to avoid errors
  if (!l.city || !selectedAddress?.city) return false;

  // Helper to normalize strings: lowercase, remove hyphens, remove spaces
  const normalize = (str) => 
    str.toLowerCase().replace(/[-\s]/g, "");

  const normalizedLocationCity = normalize(l.city);
  const normalizedSelectedCity = normalize(selectedAddress.city);

  return (
    l.state === selectedAddress.state && 
    normalizedLocationCity.includes(normalizedSelectedCity)
  );
});

    if (!loc && !selectedAddress.deliveryLocationId) {
      setDeliveryFee(0);
      setDeliveryFee2(0);
      setPickupAddress(null);
      setPickupAddressPhone(null);
      setPickupAddressCity(null);
      setShippingProvider(null);
      setIsHomeDelivery(false);
      setShippingCity(null);
      setPickupAddressState(null);
      setSelectedLocation(null);
      return;
    }

   if(loc) {
    setSelectedLocation(loc);

    if (loc.isHomeDelivery) {
      const weightFee = calcFeeFromWeights(
        loc.priceByWeights,
        totalCartWeightKg
      );
      const doorFee =
        weightFee > 0 ? weightFee : Number(loc.doorDeliveryAmount);
      setDeliveryFee(doorFee);
    } else {
      setDeliveryFee(Number(loc.doorDeliveryAmount) || 0);
    }

    setShippingProvider(loc.shippingProvider || null);
    setShippingCity(loc.city || null);

    setIsHomeDelivery(loc.isHomeDelivery || false);
    setPickupAddressState(loc.state || null);

        const pickupWeightFee = calcFeeFromWeights(
      loc.priceByWeights,
      totalCartWeightKg
    );
    const fee =
      pickupWeightFee > 0
        ? pickupWeightFee
        : 0;

        if(!loc){
                setPickupAddress(null);
                setDeliveryFee2(0);
              }

    if(!loc.isHomeDelivery){
      setIsDoorStepDelivery(isDoorStepDelivery !== null ? isDoorStepDelivery : false);
      setPickupAddress(loc.pickupAddress || null);
    setPickupAddressPhone(loc.phoneNumber || null);
    setPickupAddressCity(loc.city || null);
    setDeliveryFee2(fee);
    setDeliveryFee(0);
    }else{
      setIsDoorStepDelivery(isDoorStepDelivery !== null ? isDoorStepDelivery : true);
      setPickupAddress(null);
    setDeliveryFee(fee);
    setDeliveryFee2(0);
    }
   }
  }, [selectedAddress, cartItems, deliveryLocations, totalCartWeightKg]);

  // ---------- pickup modal filter ----------
  const filterPickupLocation = (location) => {
    if (!location.isActive || !location.pickupAddress) {
      return false;
    }

    if (stateFilter && location.state !== stateFilter) return false;
    if (cityFilter && location.city !== cityFilter) return false;
    if (providerFilter && location.shippingProvider !== providerFilter) return false;

    if (searchPickup) {
      const searchLower = searchPickup.toLowerCase();
      return (
        (location.city?.toLowerCase().includes(searchLower)) ||
        (location.pickupAddress?.toLowerCase().includes(searchLower)) ||
        (location.shippingProvider?.toLowerCase().includes(searchLower)) ||
        (location.state?.toLowerCase().includes(searchLower))
      );
    }

    return true;
  };

    const updateDeliveryLocationId = async (id) => {
    // Check if selectedAddress is available before proceeding
    if (!selectedAddress || !selectedAddress.id) {
        return;
    }
    try {

        const url = `${endpointsPath.userDeliveryAddress}/update-delivery-location-id?id=${selectedAddress.id}&deliveryLocationId=${id || ''  }`;
        const resp = await requestHandler.get(url, true);

        if (resp.statusCode === 200) {
            setSelectedAddress((prev) =>
              prev ? { ...prev, deliveryLocationId: id || null } : prev
            );
        }
    } catch (e) {
        console.error(e);
        toast.error('Failed to update delivery location');
    } finally {
        //setLoading(false);
    }
}; 

  const handlePickupSelect = (loc) => {
    setShippingCity(loc.city);
    setShippingProvider(loc.shippingProvider);

    const pickupWeightFee = calcFeeFromWeights(
      loc.priceByWeights,
      totalCartWeightKg
    );
    const fee =
      pickupWeightFee > 0
        ? pickupWeightFee
        : 0;

        if(!loc){
                setPickupAddress(null);
                setDeliveryFee2(0);
              }

    if (!loc.isHomeDelivery) {
      setIsDoorStepDelivery(isDoorStepDelivery !== null ? isDoorStepDelivery : false);
      setIsHomeDelivery(loc.isHomeDelivery || false);
    setSelectedLocation(loc);
    setPickupAddress(loc.pickupAddress);
    setPickupAddressPhone(loc.phoneNumber); 
    setPickupAddressState(loc.state);
    setPickupAddressCity(loc.city);
    setDeliveryFee2(fee);
    setDeliveryFee(0);
    }else{
      setIsDoorStepDelivery(isDoorStepDelivery !== null ? isDoorStepDelivery : true);
    setPickupAddress(null);
      setDeliveryFee(fee);
      setDeliveryFee2(0);
    
    }

    updateDeliveryLocationId(loc.id);    
    setIsPickupModalOpen(false);
  };

  // ---------- address handlers ----------
  const handleAddAddress = async () => {
    setIsLoading(true);
    try {
      if (isEditing && editableAddress) {
        const response = await requestHandler.post(
          `${endpointsPath.userDeliveryAddress}`,
          newAddress,
          true
        );

        if (response.statusCode < 202) {
          await fetchUserAddresses();
          toast.success('Address updated successfully');
          setShowAddAddress(false);
          setNewAddress({
            fullName: '',
            phoneNumber: '',
            address: '',
            city: '',
            state: '',
            country: 'Nigeria',
          });
        } else {
          toast.error(response.result?.message || 'Failed to update address');
        }
      } else {
        const response = await requestHandler.post(
          endpointsPath.userDeliveryAddress,
          newAddress,
          true
        );

        if (response.statusCode < 202) {
          await fetchUserAddresses();
          toast.success(response.result?.message || response.result?.Message || "Order completed successfully");
          setShowAddAddress(false);
          setNewAddress({
            fullName: '',
            phoneNumber: '',
            address: '',
            city: '',
            state: '',
            country: 'Nigeria',
          });
        } else {
          toast.error(
            response.result?.message ||
              'Something went wrong, please try again.'
          );
        }
      }

      setEditableAddress(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error(AppStrings.internalServerError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await requestHandler.deleteReq(
        `${endpointsPath.userDeliveryAddress}/${id}`,
        true
      );

      if (response.statusCode === 200) {
        toast.success('Address deleted successfully');
        const updatedAddresses = deliveryAddresses.filter(
          (addr) => addr.id !== id
        );
        setDeliveryAddresses(updatedAddresses);

        if (selectedAddress?.id === id) {
          setSelectedAddress(updatedAddresses[0] || null);
        }
      } else {
        toast.error(response.message || 'Failed to delete address');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Something went wrong');
    }
  };

  // ---------- payment hooks ----------
  const tx_ref = Date.now();
  const flutterwaveConfig = {
    public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY,
    tx_ref,
    amount: totalAfterDiscountCalc,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: process.env.NEXT_PUBLIC_PUBLIC_EMAIL,
      phone_number:
        selectedAddress?.phoneNumber ||
        process.env.NEXT_PUBLIC_PUBLIC_PHONE,
      name: `${selectedAddress?.fullName || AppStrings.title}`,
    },
    customizations: {
      title: AppStrings.title,
      description: 'Items Payment',
      logo: process.env.NEXT_PUBLIC_PUBLIC_LOGO,
    },
  };

  const handleFlutterPayment = useFlutterwave(flutterwaveConfig);

  /*
const paystackConfig = useMemo(() => {
  if (!initializeTransaction) return null;
alert(initializeTransaction?.reference)
  return {
    reference: initializeTransaction?.reference,
    email: process.env.NEXT_PUBLIC_PUBLIC_EMAIL,
    amount: initializeTransaction?.amount * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    currency: "NGN",
  };
}, [initializeTransaction]);
*/

const initializePaystackPayment = usePaystackPayment({
  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
});



  // ---------- order & payment submit ----------
  const buildOrderData = (paymentReference = "") => {
    const cartProducts = cartItems.map((item) => ({
      productId: item.productId || item.id,
      variantId: item.variantId || item.id,
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
    }));

    return {
      isDoorStepDelivery,
      subTotal: parseFloat(subtotal.toFixed(2)),
      subTotalAfterDiscount: parseFloat(
        subTotalAfterDiscount?.toFixed(2)
      ),
      discountPercentage: parseFloat(
        discountPercentage?.toFixed(2)
      ),
      couponCode: couponCode || null,
      deliveryFee: shippingFee,
      doorStepDeliveryFee: deliveryFee,
      pickupLocationDeliveryFee: deliveryFee2,
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      totalAfterDiscount: parseFloat(
        totalAfterDiscount?.toFixed(2)
      ),
      state: selectedAddress?.state || pickupAddressState,
      city: shippingCity || pickupAddressCity,
      customerAddress: selectedAddress?.address || '',
      shippingProvider: shippingProvider || 'TOWG',
      customerPhone:
        selectedAddress?.phoneNumber || pickupAddressPhone,
      fullName: selectedAddress?.fullName || user?.name,
      deliveryAddress: isDoorStepDelivery
        ? selectedAddress?.address
        : pickupAddress,
      paymentGateway:
        paymentMethod === 'manual' ? 'Manual' : paymentGateway,
      paymentGatewayTransactionId: paymentReference || "",
      cartProducts,
    };
  };

 const handlePaymentVerification = async (transactionId, ensuredOrderId) => {
  setIsLoading(true);
  try {
    const orderData = buildOrderData(transactionId);

    const response = await requestHandler.post(
      `${endpointsPath.checkout}/payment-transaction/${transactionId}?orderId=${ensuredOrderId}`,
      orderData,
      true
    );

    if (response.statusCode === 200) {
      localStorage.removeItem("cart");
      toast.success(response.result?.message || response.result?.Message || "Order completed successfully");
      window.location.href = "/customer/orders/";
    } else {
      toast.error(response.result?.message || response.result?.Message || "Unable to process purchase");
    }
  } catch (error) {
    console.error("Order failed:", error);
    toast.error("Payment verification failed");
  } finally {
    setIsLoading(false);
  }
};

//
/*
  const initializePaystack = async () => {
  setIsLoading(true);
  try {
    const orderData = buildOrderData();
    alert(JSON.stringify(orderData))
    const amt = orderData.totalAfterDiscount > 0? orderData.totalAfterDiscount : orderData.total;

    const response = await requestHandler.post(
      `${endpointsPath.paystack}/${amt}/initialize`,
      {},
      true
    );

    if (response.statusCode === 200) {
  setInitializeTransaction(response.result.data);

} else {
      toast.error(response.result?.message || response.result?.Message || "Unable to process purchase");
      return null;
    }
  } catch (error) {
    console.error("Order failed:", error);
    toast.error("Order failed to initiate");
    return null;
  } finally {
    setIsLoading(false);
  }
};*/

const registerOrder = async () => {
  setIsLoading(true);
  try {
    const orderData = buildOrderData();

    const response = await requestHandler.post(
      `${endpointsPath.checkout}/register-purchase`,
      orderData,
      true
    );

    if (response.statusCode === 200) {
  //setInitializeTransaction(response.result.data);
  return response.result?.data?.orderId || response.result?.data?.OrderId || null;
} else {
      toast.error(response.result?.message || response.result?.Message || "Unable to process purchase");
      return null;
    }
  } catch (error) {
    console.error("Order failed:", error);
    toast.error("Payment initiated but purchase failed");
    return null;
  } finally {
    setIsLoading(false);
  }
};

const uploadManualPaymentProof = async (ensuredOrderId) => {
  if (!manualProofFile) {
    toast.error("Please upload proof of payment before completing your order.");
    return false;
  }

  const form = new FormData();
  form.append("orderId", ensuredOrderId);

  if (manualSelectedBankAccountId) {
    form.append("bankAccountId", manualSelectedBankAccountId);
  }

  if (manualPaymentReference) {
    form.append("paymentReference", manualPaymentReference);
  }

  if (manualCustomerNote) {
    form.append("customerNote", manualCustomerNote);
  }

  form.append("proofFile", manualProofFile);

  const response = await requestHandler.postForm(
    `${endpointsPath.manualPayment}/proof`,
    form,
    true
  );

  if (response.statusCode === 200) {
    return true;
  }

  toast.error(response.result?.message || "Unable to upload proof of payment");
  return false;
};


const handleCheckoutCheck = async (e, ensuredOrderId) => {
  if (e && e.preventDefault) e.preventDefault();

  if (!ensuredOrderId) {
    toast.error("Order could not be created. Please try again.");
    return;
  }

  setIsLoading(true);
  try {
    const orderData = buildOrderData();

    if (paymentMethod === "wallet") {
      const walletResponse = await requestHandler.post(
        `${endpointsPath.checkout}/wallet?orderId=${ensuredOrderId}`,
        orderData,
        true
      );

      if (walletResponse.statusCode === 200) {
        localStorage.removeItem("cart");
        toast.success(walletResponse.result?.message);
        window.location.href = "/customer/orders/";
      } else {
        toast.error(walletResponse.result?.message || walletResponse.result?.Message || "Unable to process purchase");
      }
      return;
    }

    if (paymentMethod === "manual") {
      const proofUploaded = await uploadManualPaymentProof(ensuredOrderId);

      localStorage.removeItem("cart");

      if (proofUploaded) {
        toast.success("Order created and proof of payment uploaded successfully.");
      } else {
        toast.error("Order created, but proof upload failed. Please continue from your order page.");
      }

      window.location.href = `/customer/orders/${ensuredOrderId}`;
      return;
    }

    setIsProcessing(true);

    if (paymentGateway === "Paystack") {
      const amt =
        orderData.totalAfterDiscount > 0
          ? orderData.totalAfterDiscount
          : orderData.total;

      const initResp = await requestHandler.post(
        `${endpointsPath.paystack}/${amt}/initialize`,
        {},
        true
      );

      if (initResp.statusCode !== 200) {
        toast.error(initResp.result?.message || initResp.result?.Message || "Unable to initialize payment");
        setIsProcessing(false);
        return;
      }

      const txData = initResp.result?.data || {};
      const txReference = txData.reference || txData?.data?.reference;
      const txAmount = Number(txData.amount || txData?.data?.amount || amt);

      const paystackEmail = user?.email || process.env.NEXT_PUBLIC_PUBLIC_EMAIL;
      const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

      if (!txReference || !txAmount || !paystackEmail || !paystackPublicKey) {
        toast.error("Invalid payment initialization response");
        setIsProcessing(false);
        return;
      }

      initializePaystackPayment({
        config: {
          reference: txReference,
          email: paystackEmail,
          amount: Math.round(txAmount * 100),
          publicKey: paystackPublicKey,
          currency: "NGN",
        },
        onSuccess: async (resp) => {
          if (resp.status === "success") {
            await handlePaymentVerification(resp.reference, ensuredOrderId);
          } else {
            toast.error("Payment not successful");
          }
          setIsProcessing(false);
        },
        onClose: () => setIsProcessing(false),
      });
      return;
    }

    if (paymentGateway === "Flutterwave") {
      handleFlutterPayment({
        callback: async (resp) => {
          if (resp.status === "successful") {
            await handlePaymentVerification(resp.transaction_id || resp.tx_ref, ensuredOrderId);
          } else {
            toast.error("Payment was not successful. Please try again.");
          }
          setIsProcessing(false);
        },
        onClose: () => setIsProcessing(false),
      });
      return;
    }

    toast.error("Unsupported payment gateway selected");
  } catch (error) {
    console.error("Order failed:", error);
    toast.error(error?.message || error?.result?.message || "An error occurred while placing your order");
    setIsProcessing(false);
  } finally {
    setIsLoading(false);
  }
};


const handlePaymentSubmit = async (e) => {
  if (e && e.preventDefault) e.preventDefault();

  if (!selectedAddress && deliveryFee2 < 1) {
    toast.error("Please select a delivery address");
    return;
  }

  if (!paymentMethod) {
    toast.error("No payment method is currently available");
    return;
  }

  if (paymentMethod === "manual" && !manualProofFile) {
    toast.error("Please upload proof of payment before completing your order.");
    return;
  }

  const id = await registerOrder(); 
  if (!id) return;

  await handleCheckoutCheck(e, id); 
};

  // ---------- coupon ----------
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    try {
      //calculate discount, application will be done on order submission
      const resp = await requestHandler.post(
        `${endpointsPath.coupon}/calculate-discount`,
        { code: couponCode, orderTotal: subtotal },
        true
      );
      if (resp.statusCode === 200 && resp.result?.data) {
        setIsCouponSuccessful(true);
        const discount = resp.result.data.discountPercentage || 0;
        setDiscountPercentage(discount);
        const discountedSub = subtotal - (subtotal * discount) / 100;
        const newTotalAfter = discountedSub + shippingFee + tax;

        setSubTotalAfterDiscount(discountedSub);
        setTotalAfterDiscount(newTotalAfter);
        toast.success(`Coupon applied! ${discount}% off`);
      } else {
        toast.error(resp.result?.message || 'Invalid or expired coupon');
        setDiscountPercentage(0);
        setSubTotalAfterDiscount(subtotal);
        setTotalAfterDiscount(total);
      }
    } catch (error) {
      console.error('Coupon error:', error);
      toast.error('Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  return {
    // state & data
    cartItems,
    isDoorStepDelivery,
    hasDoorStepDeliveryOption,
    setIsDoorStepDelivery,
    deliveryFee,
    deliveryFee2,
    pickupAddress,
    pickupAddressPhone,
    pickupAddressCity,
    pickupAddressState,
    shippingProvider,
    shippingCity,
    selectedAddress,
    setSelectedAddress,
    deliveryAddresses,
    states,
    cities,
    locations,
    showAddAddress,
    setShowAddAddress,
    isEditing,
    editableAddress,
    newAddress,
    setNewAddress,
    handleAddAddress,
    handleDeleteAddress,
    hideAddresses,
    setHideAddresses,
    isPickupModalOpen,
    setIsPickupModalOpen,
    deliveryLocations,
    filterPickupLocation,
    handlePickupSelect,
    totalCartWeightKg,

    paymentMethod,
    setPaymentMethod,
    paymentMethods,
    manualPaymentAccounts,
    manualProofFile,
    setManualProofFile,
    manualSelectedBankAccountId,
    setManualSelectedBankAccountId,
    manualPaymentReference,
    setManualPaymentReference,
    manualCustomerNote,
    setManualCustomerNote,
    paymentGateway,
    setPaymentGateway,
    handlePaymentSubmit,

    subtotal,
    tax,
    vat,
    vatPer,
    shippingFee,
    total,
    discountedSubtotal,
    totalAfterDiscountCalc,

    couponCode,
    setCouponCode,
    discountPercentage,
    subTotalAfterDiscount,
    setSubTotalAfterDiscount,
    setTotalAfterDiscount,
    isApplyingCoupon,
    isCouponSuccessful,
    setIsCouponSuccessful,
    applyCoupon,

    isLoading,

    deliveryMethodSelected,
  setDeliveryMethodSelected,
  };
}












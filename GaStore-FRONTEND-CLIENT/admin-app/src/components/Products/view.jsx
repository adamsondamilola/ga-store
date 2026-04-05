import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import formatNumberToCurrency from '../../utils/numberToMoney';
import ImageGallery from '../ImageGallery';
import ClassStyle from '../../class-styles';
import Spinner from '../../utils/loader';
import { fetchTaggedProducts, fetchTagsByProductId } from '../Tags/Actions/TaggedProductService';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [featuredProduct, setFeaturedProduct] = useState(null);
  const [fId, setFId] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleting, setIsDeleting] = useState(false);
  const [tags, setTags] = useState([])

  // Fetch featured product status
  const fetchFeaturedProduct = async () => {
    try {
      const response = await requestHandler.get(
        `${endpointsPath.featuredProduct}/${productId}`,
        true
      );
      if (response.statusCode === 200 && response.result?.data) {
        setFeaturedProduct(response.result.data);
        setFId(response.result.data.id);
      } else {
        setFeaturedProduct(null);
        setFId(null);
      }
    } catch (error) {
      console.error('Fetch featured product failed:', error);
    }
  };

  // Fetch product details
  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.product}/${productId}`,
        true
      );
      if (response.statusCode === 200 && response.result?.data) {
        const productData = response.result.data;
        setProduct(productData);
        
        // Set default selected variant
        if (productData.variants?.length > 0) {
          const defaultVariant = productData.variants[0];
          setSelectedVariant(defaultVariant);
          setSelectedColor(defaultVariant.color);
        }
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      console.error('Fetch product failed:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
      const res = await fetchTagsByProductId(productId);
      setTags(res.data || []);
    };

  useEffect(() => {
    fetchFeaturedProduct();
    fetchProduct();
    loadTags();
  }, [productId]);

  // Delete product
  const deleteProduct = async () => {
    const confirm = window.confirm('Are you sure you want to delete this product? This action cannot be undone.');
    if (!confirm) return;
    
    setIsDeleting(true);
    try {
      const response = await requestHandler.deleteReq(
        `${endpointsPath.product}/${productId}`,
        true
      );

      if (response.statusCode === 200) {
        toast.success('Product deleted successfully');
        navigate('/products');
      } else {
        toast.error(response?.result?.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete product failed:', error);
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle featured product status
  const featuredAction = async () => {
    const action = fId ? 'remove from' : 'add to';
    const confirm = window.confirm(`Are you sure you want to ${action} featured products?`);
    if (!confirm) return;
    
    setLoading(true);
    try {
      let response;
      if (fId) {
        response = await requestHandler.deleteReq(`${endpointsPath.featuredProduct}/${fId}`, true);
      } else {
        const now = new Date();
        const data = {
          productId: productId,
          startDate: now,
          endDate: new Date(now.setMonth(now.getMonth() + 1)), // 1 month from now
          tagline: product?.name || '',
          isActive: true
        };
        response = await requestHandler.post(endpointsPath.featuredProduct, data, true);
      }

      if (response.statusCode <= 201) {
        toast.success(response?.result?.message || `Product ${fId ? 'removed from' : 'added to'} featured successfully`);
        fetchFeaturedProduct();
      } else {
        toast.error(response?.result?.message || 'Failed to update featured status');
      }
    } catch (error) {
      console.error('Featured action failed:', error);
      toast.error('Failed to update featured status');
    } finally {
      setLoading(false);         
    }
  };

  // Toggle approval status
  const approvalAction = async () => {
    const action = product?.isApproved ? 'disapprove' : 'approve';
    const confirm = window.confirm(`Are you sure you want to ${action} this product?`);
    if (!confirm) return;
    
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.product}/approval?productId=${productId}&approve=${!product?.isApproved}`,
        true
      );

      if (response.statusCode <= 201) {
        toast.success(response?.result?.message || `Product ${action}d successfully`);
        fetchProduct();
      } else {
        toast.error(response?.result?.message || `Failed to ${action} product`);
      }
    } catch (error) {
      console.error('Approval action failed:', error);
      toast.error(`Failed to ${action} product`);
    } finally {
      setLoading(false);         
    }
  };

  // Handle variant selection
  const handleVariantChange = (variant) => {
    if (!variant) return;
    setSelectedVariant(variant);
    setSelectedColor(variant.color);
    setSelectedImage(0);
  };

  // Get base price tier for a variant
  const getPriceTier = (variant) => {
    if (!variant?.pricingTiers?.length) return null;
    const sortedTiers = [...variant.pricingTiers].sort((a, b) => a.minQuantity - b.minQuantity);
    return sortedTiers[0];
  };

  // Get images to display (prioritize variant images)
  const getImagesToShow = () => {
    if (selectedVariant?.images?.length > 0) {
      return selectedVariant.images;
    }
    return product?.images || [];
  };

  // Render loading state
  if (loading && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner loading={true} />
      </div>
    );
  }

  // Render error state
  if (!product && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link 
            to="/products"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const basePrice = selectedVariant ? getPriceTier(selectedVariant) : null;
  const imagesToShow = getImagesToShow();

  // Tab content components
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Product Summary */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Product Overview</h2>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
  <div>
    <label className="text-sm font-medium text-gray-500">Brand</label>
    <p className="text-lg">{product?.brand?.name || 'No brand specified'}</p>
  </div>

  <div>
              <label className="text-sm font-medium text-gray-500">Approval Status </label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                product.isApproved 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {product.isApproved ? ' Approved' : ' Pending '}
              </span>
            </div>
  
  {/* Main Category */}
  {product?.category?.name && (
    <div>
      <label className="text-sm font-medium text-gray-500">Category</label>
      <p className="text-lg">{product?.category?.name}</p>
    </div>
  )}
  
  {/* Sub Category */}
  {product.subCategory?.name && (
    <div>
      <label className="text-sm font-medium text-gray-500">Sub Category</label>
      <p className="text-lg">{product.subCategory.name}</p>
    </div>
  )}
  
  {/* Product Type */}
  {product.productType?.name && (
    <div>
      <label className="text-sm font-medium text-gray-500">Type</label>
      <p className="text-lg">{product.productType.name}</p>
    </div>
  )}
  
  {/* Product Sub Type */}
  {product.productSubType?.name && (
    <div>
      <label className="text-sm font-medium text-gray-500">Sub Type</label>
      <p className="text-lg">{product.productSubType.name}</p>
    </div>
  )}
  
  {/*product.primaryColor && !product.subCategory?.hasColors && (
    <div>
      <label className="text-sm font-medium text-gray-500">Color</label>
      <p className="text-lg">{product.primaryColor}</p>
    </div>
  )*/}
</div>

          {/* Status Info */}
            {/*<div>
              <label className="text-sm font-medium text-gray-500">Availability</label>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  product.isAvailable ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                <span className="text-lg">
                  {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                  {product.stockQuantity > 0 && ` (${product.stockQuantity} available)`}
                </span>
              </div>
            </div>*/}
            
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Description</h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        </div>
      )}

      {/* Highlights */}
      {product.highlights && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Key Features</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {product.highlights.split('\n').filter(h => h.trim()).map((highlight, index) => (
              <li key={index} className="flex items-start">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span className="text-gray-700">{highlight.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      {product.specifications.disclaimer && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Disclaimer</h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {product.specifications.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const PricingTab = () => (
    <div className="space-y-6">
      {/* Bulk Pricing */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-6">Pricing Information</h3>
        
        {(selectedVariant?.pricingTiers?.length > 0) && (
          <div>
            <h4 className="text-lg font-medium mb-4">Bulk Pricing Tiers</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Minimum Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Price Per Unit</th>
                    {selectedVariant.pricingTiers.some(tier => tier.pricePerUnitGlobal) && (
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Original Price</th>
                    )}
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">You Save</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVariant.pricingTiers
                    .sort((a, b) => a.minQuantity - b.minQuantity)
                    .map((tier, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 border-b font-medium">{tier.minQuantity}+ units</td>
                        <td className="px-4 py-3 border-b text-green-600 font-bold">
                          {formatNumberToCurrency(tier.pricePerUnit.toFixed(2))}
                        </td>
                        {tier.pricePerUnitGlobal && (
                          <td className="px-4 py-3 border-b text-gray-500 line-through">
                            {formatNumberToCurrency(tier.pricePerUnitGlobal.toFixed(2))}
                          </td>
                        )}
                        <td className="px-4 py-3 border-b text-red-600">
                          {tier.pricePerUnitGlobal && (
                            <>
                              {formatNumberToCurrency((tier.pricePerUnitGlobal - tier.pricePerUnit).toFixed(2))}
                              {` (${Math.round(((tier.pricePerUnitGlobal - tier.pricePerUnit) / tier.pricePerUnitGlobal) * 100)}%)`}
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const VariantsTab = () => (
    <div className="space-y-6">
      {/* Variants Management */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-6">Product Variants</h3>
        
        {product.variants?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Variant</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Stock</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((variant, index) => (
                  <tr 
                    key={index} 
                    className={`cursor-pointer hover:bg-blue-50 ${
                      selectedVariant?.id === variant.id ? 'bg-blue-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                    onClick={() => handleVariantChange(variant)}
                  >
                    <td className="px-4 py-3 border-b">
                      <div className="flex items-center gap-3">
                        {variant.images?.[0]?.imageUrl && (
                          <img
                            src={variant.images[0].imageUrl}
                            alt={variant.color || variant.size}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">
                            {variant.name}
                          </div>
                          {<div className="font-medium">
  {[
  variant?.color && variant?.color != "null" || '',
  variant?.size && variant?.size != "null" || '',
  variant?.style && variant?.style != "null" || ''
].filter(Boolean).join(' • ') || ''}
</div> } {variant.barCode && variant.barCode != "null" && (
                            <div className="text-sm text-gray-500">Barcode: {variant.barCode}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b">{variant.sellerSKU || 'N/A'}</td>
                    <td className="px-4 py-3 border-b">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        variant.stockQuantity > 10 
                          ? 'bg-green-100 text-green-800'
                          : variant.stockQuantity > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {variant.stockQuantity} units
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b font-medium">
                      {variant.pricingTiers?.[0]?.pricePerUnit 
                        ? formatNumberToCurrency(variant.pricingTiers[0].pricePerUnit.toFixed(2))
                        : 'N/A'
                      }
                    </td>
                    <td className="px-4 py-3 border-b">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        variant.stockQuantity > 0 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {variant.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No variants available for this product
          </div>
        )}
      </div>
    </div>
  );

  const SpecificationsTab = () => (
    <div className="space-y-6">
      {product.specifications ? (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-6">Product Specifications</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Specifications */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Basic Information</h4>
              
              {product.specifications.model && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Model</label>
                  <p className="text-gray-800">{product.specifications.model}</p>
                </div>
              )}

              {product.specifications.nafdac && (
                <div>
                  <label className="text-sm font-medium text-gray-500">NAFDAC</label>
                  <p className="text-gray-800">{product.specifications.nafdac}</p>
                </div>
              )}
              
              {product.specifications.mainMaterial && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Main Material</label>
                  <p className="text-gray-800">{product.specifications.mainMaterial}</p>
                </div>
              )}
              
              {product.specifications.materialFamily && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Material Family</label>
                  <p className="text-gray-800">{product.specifications.materialFamily}</p>
                </div>
              )}
            </div>

            {/* Warranty Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Warranty & Support</h4>
              
              {product.specifications.warrantyDuration && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Warranty Duration</label>
                  <p className="text-gray-800">{product.specifications.warrantyDuration}</p>
                </div>
              )}
              
              {product.specifications.warrantyType && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Warranty Type</label>
                  <p className="text-gray-800">{product.specifications.warrantyType}</p>
                </div>
              )}
              
              {product.specifications.productWarranty && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Warranty</label>
                  <p className="text-gray-800">{product.specifications.productWarranty}</p>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Additional Information</h4>
              
              {product.specifications.disclaimer && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Disclaimer</label>
                  <p className="text-gray-800 whitespace-pre-wrap">{product.specifications.disclaimer}</p>
                </div>
              )}

              {product.specifications.whatIsInTheBox && (
                <div>
                  <label className="text-sm font-medium text-gray-500">What's in the Box</label>
                  <p className="text-gray-800 whitespace-pre-wrap">{product.specifications.whatIsInTheBox}</p>
                </div>
              )}
              
              {product.specifications.fromTheManufacturer && (
                <div>
                  <label className="text-sm font-medium text-gray-500">From the Manufacturer</label>
                  <p className="text-gray-800 whitespace-pre-wrap">{product.specifications.fromTheManufacturer}</p>
                </div>
              )}
              
              {product.specifications.note && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-gray-800 whitespace-pre-wrap">{product.specifications.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No specifications available for this product
        </div>
      )}
    </div>
  );

    const CreatedAndApprovedByTab = () => (
    <div className="space-y-6">
      {product.user ? (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-6">Creator and Approver</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Creator Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Created By</h4>
              
              {product.user.firstName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-800">{product.user.firstName} {product?.user?.lastName}</p>
                </div>
              )}
              
              {product.user.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-800">{product.user.email}</p>
                </div>
              )}
              
              {product.user.isAdmin && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Type</label>
                  <p className="text-gray-800">{product.user.isSuperAdmin? 'Super Admin' : 'Admin'}</p>
                </div>
              )}
            </div>

{/* Approver Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Approved By</h4>
              {product.approver.email? 
              <div>
              {product.approver.firstName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-800">{product.approver.firstName} {product?.approver?.lastName}</p>
                </div>
              )}
              
              {product.approver.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-800">{product.approver.email}</p>
                </div>
              )}
              
              {product.approver.isAdmin && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Type</label>
                  <p className="text-gray-800">{product.approver.isSuperAdmin? 'Super Admin' : 'Admin'}</p>
                </div>
              )}
              </div>
              :
              <div className="text-center py-8 text-gray-500">
          Post not approved or approver information not available
        </div>
        }
            </div>

          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Creator information not available
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen space-y-6 bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_40%,#f8fafc_100%)] px-4 py-6 sm:px-6">
      <Spinner loading={loading || isDeleting} />
      
      {/* Header Actions */}
      <div className="mx-auto max-w-7xl rounded-[28px] border border-slate-200 bg-white px-4 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:px-6">
        <div className="py-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-600">Product ID: {product.id}</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={featuredAction}
                disabled={loading}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                  featuredProduct 
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              > 
                {featuredProduct ? '⭐ Remove Featured' : '⭐ Make Featured'}
              </button>

              <button 
                onClick={approvalAction}
                disabled={loading}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                  product.isApproved 
                    ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              > 
                {product.isApproved ? '🚫 Disapprove' : '✅ Approve'}
              </button>
              
              <Link 
                to={`/products/${product.id}/update`}
                className="px-4 py-2 bg-slate-100 text-slate-800 rounded-2xl hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                ✏️ Edit Product
              </Link>

              <button 
                onClick={deleteProduct}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️ Delete Product
              </button>
              
              <Link 
                to="/products"
                className="px-4 py-2 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                ← Back to Products
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-0 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Image Gallery */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <ImageGallery 
                imagesToShow={imagesToShow} 
                product={product}
                selectedVariant={selectedVariant}
              />
              
              {/* Tags Section */}
{/*<div className="bg-white rounded-lg p-5 shadow-sm mt-6 border border-gray-100">
  <h3 className="font-semibold text-lg mb-4 text-gray-800">Tags</h3>

  <div className="relative">
    <ul className="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-md w-full max-h-48 overflow-y-auto divide-y divide-gray-100">
      {tags?.length > 0 ? (
        tags.map((t, idx) => (
          <li
            key={idx}
            className="px-4 py-2 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
          >
            {t.name}
          </li>
        ))
      ) : (
        <li className="px-4 py-2 text-gray-500 text-sm text-center">
          No tags available
        </li>
      )}
    </ul>
  </div>
</div>*/}


              {/* Quick Stats */}
              <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <h3 className="font-semibold mb-3">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Variants</span>
                    <span className="font-medium">{product.variants?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Images</span>
                    <span className="font-medium">{(product.images?.length || 0) + (product.variants?.reduce((sum, v) => sum + (v.images?.length || 0), 0) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium">
                      {new Date(product.dateCreated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            <div className="mb-6 rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <nav className="flex overflow-x-auto">
                {
                ['overview', 'variants', 'pricing', 'specifications', 'Created By']
                //['overview', 'variants', 'specifications', 'Created By']
                .map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-gray-500 hover:bg-slate-50 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'variants' && <VariantsTab />}
              {activeTab === 'pricing' && <PricingTab />}
              {activeTab === 'specifications' && <SpecificationsTab />}
              {activeTab === 'Created By' && <CreatedAndApprovedByTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

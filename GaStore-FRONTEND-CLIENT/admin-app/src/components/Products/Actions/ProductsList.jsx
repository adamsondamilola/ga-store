import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import endpointsPath from '../../../constants/EndpointsPath';
import requestHandler from '../../../utils/requestHandler';

const ProductList = ({getProducts = [], getTotalPages = 1, searchTerm = ''}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(getTotalPages);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    //fetchProducts();
  }, [currentPage, products, searchTerm]);

  const fetchProducts = async () => {
    if(getProducts.length > 0){
      setProducts(getProducts);
        setTotalPages(getTotalPages);
        return;
    }
    try {
      setLoading(true);
      const response = await requestHandler.get(
        `${endpointsPath.product}/admin?searchTerm=${searchTerm}&pageNumber=${currentPage}&pageSize=10`,
        true
      );
      
      if (response.statusCode === 200) {
        const productsData = response.result?.data || response.result || response.data || [];
        const totalPagesData = response.result?.totalPages || response.totalPages || 1;
        setProducts(productsData);
        setTotalPages(totalPagesData);
        
        if (productsData.length === 0) {
          toast.info('No products found');
        }
      } else {
        toast.error(`Failed to fetch products: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(`Error fetching products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const viewProductDetails = (product) => {
    //setSelectedProduct(product);
    //setShowDetailsModal(true);
    window.location.href=`/products/${product.id}/details`
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedProduct(null);
  };

  // Calculate total stock quantity for each product
  const productsWithStock = useMemo(() => {
    return products.map(product => {
      const totalVariantStock = product.variantsDto?.reduce((sum, variant) => 
        sum + (variant.stockQuantity || 0), 0) || 0;
      
      //const totalStock = product.stockQuantity > 0 ? product.stockQuantity : totalVariantStock;
      const totalStock = totalVariantStock;
      
      const variantNames = product.variantsDto
        ?.map(variant => variant.name?.trim())
        .filter(name => name && name !== '')
        .join(', ') || 'No variants';

      return {
        ...product,
        totalStock,
        variantNames
      };
    });
  }, [products]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading products...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      
      {productsWithStock.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No products found</div>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {productsWithStock.map((product) => (
              <div 
                key={product.id} 
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => viewProductDetails(product)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-lg font-semibold">{product.name}</h2>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.isApproved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.isApproved ? 'Approved' : 'Pending Approval'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.isAvailable 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{product.description?.substring(0, 100)}...</p>
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center">
                        <span className="font-medium text-sm">Total Stock:</span>
                        <span className="ml-2 text-sm">
                          {product.totalStock.toLocaleString()} units
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="font-medium text-sm">Variants:</span>
                        <span className="ml-2 text-sm">
                          {product.variantsDto?.length || 0} variant(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {product.images?.length > 0 && (
                    <img
                      src={product.images[0].imageUrl}
                      alt={product.images[0].altText || product.name}
                      className="w-20 h-20 object-cover rounded ml-4"
                    />
                  )}
                </div>

                {/* Show individual variant details if needed */}
            {product.variantsDto?.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <h4 className="font-medium text-sm mb-2">Variant Details:</h4>
                <div className="space-y-2">
                  {product.variantsDto.map((variant, index) => (
                    <div key={variant.id || index} className="text-xs bg-gray-50 p-2 rounded">
                      <div className="flex justify-between">
                        <span>Variant {index + 1}:</span>
                        <span>{variant.stockQuantity} units</span>
                      </div>
                      {variant.name && (
                        <div className="text-gray-600">Name: {variant.name}</div>
                      )}
                      {variant.color && (
                        <div className="text-gray-600">Color: {variant.color}</div>
                      )}
                      {variant.size && (
                        <div className="text-gray-600">Size: {variant.size}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
                
                <div className="mt-3 text-xs text-gray-500">
                  Created: {new Date(product.dateCreated).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400"
              >
                Previous
              </button>
              
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;
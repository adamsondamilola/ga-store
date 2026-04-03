import React, { useEffect, useState } from 'react';
import Pagination from '../Pagination';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import ClassStyle from '../../class-styles';
import { Link } from 'react-router-dom';
import dateTimeToWord from '../../utils/dateTimeToWord';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.featuredProduct}?searchTerm=${searchTerm}&pageNumber=${page}&pageSize=${pageSize}`,
        true
      );
      if (response.statusCode === 200 && response.result?.data) {
        setProducts(response.result.data);
        setTotalPages(response.result.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setFormModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await requestHandler.deleteReq(`${endpointsPath.product}/${id}`, true);
      if (response.statusCode === 200) {
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        toast.error(response.result?.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete product');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, page]);

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search featured products..."
          className="border px-2 py-1 rounded w-64"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />
        {/*<Link
          to={'/products/new'}
          className={ClassStyle.button}
        >
          + New Product
        </Link>*/}
      </div>

      <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Available</th>
            <th className="border px-2 py-1">Details</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product?.product?.id}>
              <td className="border px-2 py-1">{dateTimeToWord(product?.dateCreated)}</td>
              <td className="border px-2 py-1">{product?.name || product?.product?.name}</td>
              <td className="border px-2 py-1">{product.isAvailable || product?.product?.isAvailable ? 'Yes' : 'No'}</td>
              <td className="border px-2 py-1 whitespace-nowrap">
              <Link 
                  className="text-green-600 hover:text-green-800 mr-2" 
                  to={`/products/${product?.product?.id}/details`}
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
            </table>
          </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

    </div>
  );
};

export default FeaturedProducts;
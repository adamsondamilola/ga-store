import React, { useEffect, useState } from 'react';
import Pagination from '../Pagination';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import requestHandler from '../../utils/requestHandler';
import CouponList from './CouponList';
import CouponForm from './CouponForm';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      let url = `${endpointsPath.coupon}?searchTerm=${searchTerm}&pageNumber=${page}&pageSize=${pageSize}`;
      const response = await requestHandler.get(url, true);

      if (response.statusCode === 200 && response.result?.data) {
        setCoupons(response.result.data);
        setTotalPages(response.result.totalPages || 1);
      }
      else if (response.statusCode === 200){
        toast.success(response.result.message);
      } else {
        toast.error(response.result.message || 'Failed to load coupons');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon) => {
    setFormData(coupon);
    setFormModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const response = await requestHandler.deleteReq(`${endpointsPath.coupon}/${id}`, true);
      if (response.statusCode === 200) {
        toast.success('Coupon deleted successfully');
        fetchCoupons();
      } else {
        toast.error(response.result?.message || 'Failed to delete coupon');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete coupon');
    }
  };

  const handleCreate = () => {
    setFormData(null);
    setFormModalOpen(true);
  };

  useEffect(() => {
    fetchCoupons();
  }, [searchTerm, page]);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search coupons..."
            className="border px-3 py-2 rounded w-full"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <button
          className="bg-brand text-white px-4 py-2 rounded shadow text-sm"
          onClick={handleCreate}
        >
          + New Coupon
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <CouponList
          loading={loading}
          coupons={coupons}
          onEdit={handleEdit}
          fetchCoupons={fetchCoupons}
          onDelete={handleDelete}
        />
      </div>

      <div className="mt-4">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </div>

      {formModalOpen && (
        <CouponForm
          open={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          fetchCoupons={fetchCoupons}
          formData={formData}
        />
      )}
    </div>
  );
};

export default Coupons;

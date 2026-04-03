import React, { useEffect, useState } from 'react';
import Pagination from '../Pagination';
import ProductSubTypeList from './Actions/ProductSubTypeList';
import ProductSubTypeFormModal from './Actions/ProductSubTypeFormModal';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import PageTitleComponent from '../PageTitle';
import ClassStyle from '../../class-styles';

const ProductSubTypes = () => {
  const [productSubTypes, setProductSubTypes] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProductSubTypes = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.productSubType}?searchTerm=${searchTerm}&pageNumber=${page}&pageSize=${pageSize}`,
        true
      );
      if (response.statusCode === 200 && response.result?.data) {
        setProductSubTypes(response.result.data);
        setTotalPages(response.result.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (category) => {
    try {        
      const response = await requestHandler.get(`${endpointsPath.productSubType}/${category.id}`, true);
      if (response.statusCode === 200) {
        setFormData({ ...response.result.data, id: category.id });
        setFormModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching category details:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const response = await requestHandler.deleteReq(`${endpointsPath.productSubType}/${id}`, true);
      if(response.statusCode === 200){
        toast.success(response.result.message)
        fetchProductSubTypes();
    }else {
        toast.error(response.result.message)
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        const response = await requestHandler.put(`${endpointsPath.productSubType}`, data, true);
        if(response.statusCode === 200){
            toast.success(response.result.message)
        }else{
            toast.error(response.result.message)
        }
      } else {
        const response = await requestHandler.post(endpointsPath.productSubType, data, true);
        if(response.statusCode === 200){
            toast.success(response.result.message)
        }else{
            toast.error(response.result.message)
        }
      }
      setFormModalOpen(false);
      fetchProductSubTypes();
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  useEffect(() => {
    fetchProductSubTypes();
  }, [searchTerm, page]);

  return (
    <div className="p-4">
        <PageTitleComponent title='Product Sub-Types'/>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search product types..."
          className="border px-2 py-1 rounded"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />
        <button
          onClick={() => {
            setFormData(null);
            setFormModalOpen(true);
          }}
          className={ClassStyle.button} 
        >
          + New Product Sub-Type
        </button>
      </div>

      <ProductSubTypeList
        loading={loading}
        productSubTypes={productSubTypes}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {formModalOpen && (
        <ProductSubTypeFormModal
          formData={formData}
          onClose={() => setFormModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default ProductSubTypes;

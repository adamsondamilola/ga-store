import React, { useEffect, useState } from 'react';
import Pagination from '../Pagination';
import ProductTypeList from './Actions/ProductTypeList';
import ProductTypeFormModal from './Actions/ProductTypeFormModal';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import PageTitleComponent from '../PageTitle';
import ClassStyle from '../../class-styles';

const ProductTypes = () => {
  const [productTypes, setProductTypes] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProductTypes = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.productType}?searchTerm=${searchTerm}&pageNumber=${page}&pageSize=${pageSize}`,
        true
      );
      if (response.statusCode === 200 && response.result?.data) {
        setProductTypes(response.result.data);
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
      const response = await requestHandler.get(`${endpointsPath.productType}/${category.id}`, true);
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
      const response = await requestHandler.deleteReq(`${endpointsPath.productType}/${id}`, true);
      if(response.statusCode === 200){
        toast.success(response.result.message)
        fetchProductTypes();
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
        const response = await requestHandler.put(`${endpointsPath.productType}`, data, true);
        if(response.statusCode === 200){
            toast.success(response.result.message)
        }else{
            toast.error(response.result.message)
        }
      } else {
        const response = await requestHandler.post(endpointsPath.productType, data, true);
        if(response.statusCode === 200){
            toast.success(response.result.message)
        }else{
            toast.error(response.result.message)
        }
      }
      setFormModalOpen(false);
      fetchProductTypes();
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, [searchTerm, page]);

  return (
    <div className="p-4">
        <PageTitleComponent title='Product Types'/>
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
          + New Product Type
        </button>
      </div>

      <ProductTypeList
        loading={loading}
        productTypes={productTypes}
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
        <ProductTypeFormModal
          formData={formData}
          onClose={() => setFormModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default ProductTypes;

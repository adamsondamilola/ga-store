import React, { useEffect, useState } from 'react';
import Pagination from '../Pagination';
import CategoryList from './Actions/CategoryList';
import CategoryFormModal from './Actions/CategoryFormModal';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import PageTitleComponent from '../PageTitle';
import ClassStyle from '../../class-styles';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.category}?searchTerm=${searchTerm}&pageNumber=${page}&pageSize=${pageSize}`,
        true
      );
      if (response.statusCode === 200 && response.result?.data) {
        setCategories(response.result.data);
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
      const response = await requestHandler.get(`${endpointsPath.category}/${category.id}`, true);
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
      const response = await requestHandler.deleteReq(`${endpointsPath.category}/${id}`, true);
      if(response.statusCode === 200){
        toast.success(response.result.message)
        fetchCategories();
    }else {
        toast.error(response.result.message)
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

const handleSave = async (data) => {
  try {
    // Construct FormData
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('isActive', data.isActive);

    if (data.imageFile) {
      formData.append('imageFile', data.imageFile);
    }

    if (data.id) {
      formData.append('id', data.id);
    }
    
    // Send the FormData
    const response = data.id
      ? await requestHandler.putForm(`${endpointsPath.category}`, formData, true)
      : await requestHandler.postForm(`${endpointsPath.category}`, formData, true);

    if (response.statusCode === 200 || response.statusCode === 201) {
      toast.success(response.result.message);
    } else {
      toast.error(response.result.message);
    }

    setFormModalOpen(false);
    fetchCategories();
  } catch (err) {
    console.error('Save failed:', err);
    toast.error('Something went wrong while saving.');
  }
};


  useEffect(() => {
    fetchCategories();
  }, [searchTerm, page]);

  return (
    <div className="p-4">
        <PageTitleComponent title='Categories'/>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search categories..."
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
          + New Category
        </button>
      </div>

      <CategoryList
        loading={loading}
        categories={categories}
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
        <CategoryFormModal
          formData={formData}
          onClose={() => setFormModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Categories;

import React, { useEffect, useState } from 'react';
import Pagination from '../Pagination';
import SliderList from './Actions/SliderList';
import SliderFormModal from './Actions/SliderFormModal';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import PageTitleComponent from '../PageTitle';
import ClassStyle from '../../class-styles';

const Sliders = () => {
  const [sliders, setSliders] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const type = "Slider";

  const fetchSliders = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.banner}?searchTerm=${searchTerm}&pageNumber=${page}&pageSize=${pageSize}&type=${type}`,
        true
      );
      if (response.statusCode === 200 && response.result?.data) {
        setSliders(response.result.data);
        setTotalPages(response.result.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (slider) => {
    try {        
      const response = await requestHandler.get(`${endpointsPath.banner}/${slider.id}`, true);
      if (response.statusCode === 200) {
        setFormData({ ...response.result.data, id: slider.id });
        setFormModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching slider details:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slider?')) return;
    try {
      const response = await requestHandler.deleteReq(`${endpointsPath.banner}/${id}`, true);
      if(response.statusCode === 200){
        toast.success(response.result.message)
        fetchSliders();
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
    formData.append('title', data.title);
    formData.append('link', data.link);
    formData.append('hasLink', data.hasLink);
    formData.append('type', 'Slider');
    formData.append('isActive', data.isActive);

    if (data.imageFile) {
      formData.append('imageFile', data.imageFile);
    }

    if (data.id) {
      formData.append('id', data.id);
    }
    
    // Send the FormData
    const response = data.id
      ? await requestHandler.putForm(`${endpointsPath.banner}`, formData, true)
      : await requestHandler.postForm(`${endpointsPath.banner}`, formData, true);

    if (response.statusCode === 200 || response.statusCode === 201) {
      toast.success(response.result.message);
    } else {
      toast.error(response.result.message);
    }

    setFormModalOpen(false);
    fetchSliders();
  } catch (err) {
    console.error('Save failed:', err);
    toast.error('Something went wrong while saving.');
  }
};


  useEffect(() => {
    fetchSliders();
  }, [searchTerm, page]);

  return (
    <div className="p-4">
        <PageTitleComponent title='Sliders'/>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search sliders..."
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
          + New Slider
        </button>
      </div>

      <SliderList
        loading={loading}
        sliders={sliders}
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
        <SliderFormModal
          formData={formData}
          onClose={() => setFormModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Sliders;

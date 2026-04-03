import React, { useEffect, useState } from 'react';
import SubCategoryFormModal from '../Actions/SubCategoryFormModal';
import requestHandler from '../../../utils/requestHandler';
import endpointsPath from '../../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import PageTitleComponent from '../../PageTitle';

const CreateSubCategory = () => {
  const [formModalOpen, setFormModalOpen] = useState(true);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);


  const handleSave = async (data) => {
    try {
        const response = await requestHandler.post(endpointsPath.subCategory, data, true);
        if(response.statusCode === 200){
            toast.success(response.result.message)
            setFormData(null)
        }else{
            toast.error(response.result.message)
        }
      //setFormModalOpen(false);

    } catch (err) {
      console.error('Save failed:', err);
    }
  };


  return (
    <div className="p-4">
        <PageTitleComponent title='Create SubCategory'/>
           {formModalOpen && (
        <SubCategoryFormModal
          formData={formData}
          onClose={() => setFormModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default CreateSubCategory;

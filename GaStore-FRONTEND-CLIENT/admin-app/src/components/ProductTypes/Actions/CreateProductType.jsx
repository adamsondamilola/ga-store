import React, { useEffect, useState } from 'react';
import ProductTypeFormModal from '../Actions/ProductTypeFormModal';
import requestHandler from '../../../utils/requestHandler';
import endpointsPath from '../../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import PageTitleComponent from '../../PageTitle';

const CreateProductType = () => {
  const [formModalOpen, setFormModalOpen] = useState(true);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);


  const handleSave = async (data) => {
    try {
        const response = await requestHandler.post(endpointsPath.productType, data, true);
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
        <PageTitleComponent title='Create Product Type'/>
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

export default CreateProductType;

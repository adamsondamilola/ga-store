import React, { useState, useEffect } from 'react';
import ClassStyle from '../../../class-styles';
import endpointsPath from '../../../constants/EndpointsPath';
import requestHandler from '../../../utils/requestHandler';

const SubCategoryFormModal = ({ formData, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: null,
    categoryId: null,
    name: '',
    hasColors: false,
    hasSizes: false,
    hasStyles: false,
    isActive: true
  });

  const [categories, setCategories] = useState([]);

  useEffect(()=>{
    const fetchCategories = async () => {
      //setLoading(true);
      try {
        const response = await requestHandler.get(
          `${endpointsPath.category}?searchTerm=${''}&pageNumber=${1}&pageSize=${50}`,
          true
        );
        if (response.statusCode === 200 && response.result?.data) {
          setCategories(response.result.data);
        }
      } catch (error) {
        console.error('Fetch failed:', error);
      } finally {
        //setLoading(false);
      }
    };
    fetchCategories();
  },[]);

  useEffect(() => {
    if (formData) setForm(formData);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    if(!form.id) setForm({
      id: null,
      categoryId: null,
      name: '',
      hasColors: false,
      hasSizes: false,
      hasStyles: false,
      isActive: true
    })
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-white p-6 rounded w-96">
        <h2 className="text-lg font-semibold mb-4">{form.id ? 'Edit' : 'Create'} SubCategory</h2>
        <form onSubmit={handleSubmit}>
          <select
            name='categoryId'
            value={form.categoryId || ''}
            onChange={handleChange}
            className={ClassStyle.input}
            required
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}
              >{cat.name}</option>
            ))}
          </select>
          <div className='mb-2'></div>
          <input
            className={ClassStyle.input}
            type="text"
            name="name"
            placeholder="Sub-category name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <div className='mb-2'></div>
          <div className="flex flex-col mb-4">
            {['hasColors', 'hasSizes', 'hasStyles', 'isActive'].map(field => (
              <label key={field} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name={field}
                  checked={form[field]}
                  onChange={handleChange}
                />
                <span>{field}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-1 border">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubCategoryFormModal;
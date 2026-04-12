import React, { useEffect, useState } from 'react';
import ClassStyle from '../../../class-styles';
import endpointsPath from '../../../constants/EndpointsPath';
import requestHandler from '../../../utils/requestHandler';

const initialFormState = {
  id: null,
  productTypeId: '',
  name: '',
  imageUrl: '',
  imageFile: null,
  isActive: true,
  productTypeName: ''
};

const ProductSubTypeFormModal = ({ formData, onClose, onSave }) => {
  const [form, setForm] = useState(initialFormState);
  const [productTypes, setProductTypes] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const response = await requestHandler.get(
          `${endpointsPath.productType}?searchTerm=${''}&pageNumber=${1}&pageSize=${50}`,
          true
        );
        if (response.statusCode === 200 && response.result?.data) {
          setProductTypes(response.result.data);
        }
      } catch (error) {
        console.error('Fetch failed:', error);
      }
    };

    fetchProductTypes();
  }, []);

  useEffect(() => {
    if (formData) {
      setForm({
        ...initialFormState,
        ...formData,
        productTypeId: formData.productTypeId || '',
        imageUrl: formData.imageUrl || '',
        imageFile: null
      });
      setPreviewUrl(formData.imageUrl || null);
      return;
    }

    setForm(initialFormState);
    setPreviewUrl(null);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      const file = files?.[0] || null;
      setForm((prev) => ({
        ...prev,
        imageFile: file
      }));

      if (file) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(form.imageUrl || null);
      }

      return;
    }

    const nextValue = type === 'checkbox' ? checked : value;
    setForm((prev) => ({
      ...prev,
      [name]: nextValue
    }));

    if (name === 'imageUrl' && !form.imageFile) {
      setPreviewUrl(value || null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);

    if (!form.id) {
      setForm(initialFormState);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-96 rounded bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">{form.id ? 'Edit' : 'Create'} Product Sub-Type</h2>
        <form onSubmit={handleSubmit}>
          <select
            name="productTypeId"
            value={form.productTypeId || ''}
            onChange={handleChange}
            className={ClassStyle.input}
            required
          >
            <option value="">Select Product Type</option>
            {productTypes.map((productType) => (
              <option key={productType.id} value={productType.id}>
                {productType.name}
              </option>
            ))}
          </select>

          <div className="mb-2"></div>

          <input
            className={ClassStyle.input}
            type="text"
            name="name"
            placeholder="Product sub-type name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label className="mt-4 block text-sm font-medium text-gray-700">Image URL</label>
          <input
            className={ClassStyle.input}
            type="text"
            name="imageUrl"
            placeholder="https://example.com/image.jpg"
            value={form.imageUrl || ''}
            onChange={handleChange}
          />

          <label className="mt-4 block text-sm font-medium text-gray-700">Upload Image</label>
          <input
            className="mb-2"
            type="file"
            accept="image/*"
            name="imageFile"
            onChange={handleChange}
          />

          <div className="flex justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="mb-4 h-24 w-24 rounded border object-cover"
              />
            ) : null}
          </div>

          <div className="mb-4 flex flex-col">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isActive"
                checked={Boolean(form.isActive)}
                onChange={handleChange}
              />
              <span>isActive</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="border px-4 py-1">
              Cancel
            </button>
            <button type="submit" className="rounded bg-blue-600 px-4 py-1 text-white">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductSubTypeFormModal;

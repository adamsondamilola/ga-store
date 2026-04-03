import React, { useState, useEffect } from 'react';
import ClassStyle from '../../../class-styles';

const CategoryFormModal = ({ formData, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: null,
    name: '',
    imageUrl: '',
    imageFile: null,
    isActive: true
  });

  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (formData) {
      setForm({ ...formData, imageFile: null });
      setPreviewUrl(formData.imageUrl || null);
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setForm(prev => ({ ...prev, imageFile: file }));

      if (file) {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave(form);

    if (!form.id) {
      setForm({
        id: null,
        name: '',
        imageUrl: '',
        imageFile: null,
        isActive: true
      });
      setPreviewUrl(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-white p-6 rounded w-96">
        <h2 className="text-lg font-semibold mb-4">
          {form.id ? 'Edit' : 'Create'} Category
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            className={ClassStyle.input}
            type="text"
            name="name"
            placeholder="Category name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label className="block mt-4 text-sm font-medium text-gray-700">Upload Image</label>
          <input
            className="mb-2"
            type="file"
            accept="image/*"
            name="imageFile"
            onChange={handleChange}
          />

          <div className='flex justify-center'>
            {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-24 h-24 object-cover rounded mb-4 border"
            />
          )}
          </div>

          <label className="flex items-center space-x-2 mt-4">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            <span>Is Active</span>
          </label>

          <div className="flex justify-end space-x-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-1 border">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;

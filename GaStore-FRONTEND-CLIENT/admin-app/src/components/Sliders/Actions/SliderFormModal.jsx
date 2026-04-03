import React, { useState, useEffect } from 'react';
import ClassStyle from '../../../class-styles';

const SliderFormModal = ({ formData, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: null,
    title: '',
    hasLink: false,
    link: '',
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

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setForm(prev => ({ ...prev, imageFile: file }));

      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      if (file) {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      } else {
        setPreviewUrl(form.imageUrl || null);
      }
    } else {
      setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedForm = {
      ...form,
      title: form.title.trim(),
      link: form.link?.trim(),
    };
    onSave(cleanedForm);

    if (!form.id) {
      setForm({
        id: null,
        title: '',
        hasLink: false,
        link: '',
        imageUrl: '',
        imageFile: null,
        isActive: true
      });
      setPreviewUrl(null);
    }
  };

  const isSubmitDisabled = !form.title.trim() || (!form.id && !form.imageFile);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white p-6 rounded w-96">
        <h2 className="text-lg font-semibold mb-4">
          {form.id ? 'Edit' : 'Create'} Slider
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Slider Title
            </label>
            <input
              id="title"
              className={ClassStyle.input}
              type="text"
              name="title"
              placeholder="Slider title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">
              Upload Image
            </label>
            <input
              id="imageFile"
              className="mb-2"
              type="file"
              accept="image/*"
              name="imageFile"
              onChange={handleChange}
            />
          </div>

          {previewUrl && (
            <div className='flex justify-center mb-4'>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-24 h-14 object-cover rounded border"
              />
            </div>
          )}

          <div className="mb-4 flex items-center space-x-2">
            <input
              id="hasLink"
              type="checkbox"
              name="hasLink"
              checked={form.hasLink}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="hasLink" className="text-sm font-medium text-gray-700">
              Has Link
            </label>
          </div>

          {form.hasLink && (
            <div className="mb-4">
              <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
                Link URL
              </label>
              <input
                id="link"
                className={ClassStyle.input}
                type="url"
                name="link"
                placeholder="https://example.com"
                value={form.link}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="flex items-center space-x-2 mt-4 mb-4">
            <input
              id="isActive"
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Is Active
            </label>
          </div>

          <div className="flex justify-end space-x-2 mt-6 mb-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitDisabled}
              className={`px-4 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isSubmitDisabled ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SliderFormModal;

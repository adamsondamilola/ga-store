import React from 'react';

const SliderList = ({ loading, sliders, onEdit, onDelete }) => {
  if (loading) return <p>Loading...</p>;

  if (sliders.length === 0) {
    return <p>No sliders found.</p>;
  }

  return (
    <div className="relative overflow-x-auto">
          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2 py-1">Image</th>
          <th className="border px-2 py-1">Title</th>
          <th className="border px-2 py-1">Url</th>
          <th className="border px-2 py-1">Active</th>
          <th className="border px-2 py-1">Actions</th>
        </tr>
      </thead>
      <tbody>
        {sliders.map(slider => (
          <tr key={slider?.id}>
            <td className="border px-2 py-1">
              {slider?.imageUrl && (
                /\.(mp4|webm|mov|avi|m4v)(\?.*)?$/i.test(slider.imageUrl) ? (
                  <video src={slider.imageUrl} className="w-16 h-12 rounded-lg object-cover" muted />
                ) : (
                  <img src={slider.imageUrl} alt={slider?.title} className="w-12 h-12 rounded-lg object-contain" />
                )
              )}
            </td>
            <td className="border px-2 py-1">{slider?.title}</td>
            <td className="border px-2 py-1">{slider?.link}</td>
            <td className="border px-2 py-1">{slider?.isActive ? 'Yes' : 'No'}</td>
            <td className="border px-2 py-1">
              <button className="text-blue-600 mr-2" onClick={() => onEdit(slider)}>Edit</button>
              <button className="text-red-600" onClick={() => onDelete(slider?.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
};

export default SliderList;

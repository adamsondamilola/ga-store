import React from 'react';

const ProductSubTypeList = ({ loading, productSubTypes, onEdit, onDelete }) => {
  if (loading) return <p>Loading...</p>;

  if (productSubTypes.length === 0) {
    return <p>No product sub-types found.</p>;
  }

  return (
    <div className="relative overflow-x-auto">
          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2 py-1">Product Type</th>
          <th className="border px-2 py-1">Name</th>
          <th className="border px-2 py-1">Active</th>
          <th className="border px-2 py-1">Actions</th>
        </tr>
      </thead>
      <tbody>
        {productSubTypes.map(cat => (
          <tr key={cat.id}>
            <td className="border px-2 py-1">{cat?.productTypeName}</td>
            <td className="border px-2 py-1">{cat.name}</td>
            <td className="border px-2 py-1">{cat.isActive ? 'Yes' : 'No'}</td>
            <td className="border px-2 py-1">
              <button className="text-blue-600 mr-2" onClick={() => onEdit(cat)}>Edit</button>
              <button className="text-red-600" onClick={() => onDelete(cat.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
};

export default ProductSubTypeList;

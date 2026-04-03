const BannerList = ({ loading, banners, onEdit, onDelete }) => {
  if (loading) return <p>Loading...</p>;

  if (banners.length === 0) {
    return <p>No banner found.</p>;
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
        {banners.map(banner => (
          <tr key={banner?.id}>
            <td className="border px-2 py-1">{banner?.imageUrl && <img src={banner?.imageUrl} alt={banner?.title} className="w-12 h-12 rounded-lg object-contain" />}</td>
            <td className="border px-2 py-1">{banner?.title}</td>
            <td className="border px-2 py-1">{banner?.link}</td>
            <td className="border px-2 py-1">{banner?.isActive ? 'Yes' : 'No'}</td>
            <td className="border px-2 py-1">
              <button className="text-blue-600 mr-2" onClick={() => onEdit(banner)}>Edit</button>
              <button className="text-red-600" onClick={() => onDelete(banner?.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
};

export default BannerList;

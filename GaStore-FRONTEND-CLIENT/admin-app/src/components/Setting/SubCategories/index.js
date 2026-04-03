"use client"
import { useState, useEffect } from "react";
import requestHandler from "../../../../utils/requestHandler";
import endpointsPath from "../../../../constants/EndpointsPath";
import { formatImagePath } from "../../../../utils/formatImagePath";
import { toast } from "react-toastify";
import { useParams, useRouter } from "next/navigation";
import { truncateText } from "../../../../utils/truncateText";
import { formatJsonArrayAsTags } from "../../../../utils/formatJsonArrayAsTags";

  const SubCategoryManagement = () => {
  const [subCategories, setSubCategories] = useState([]);
  const [formData, setFormData] = useState({ name: "", description: "", properties: [], image: "" });
  const [editMode, setEditMode] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const { id } = useParams();

  // Fetch sub-categories
  useEffect(() => {
    
    if (!id) return;
    const fetchCategoryDetails = async () => {
      try {
        const response = await requestHandler.get(`${endpointsPath.subCategory}/${id}`);
        const category = response.result.data;
        setCategoryName(category.name);
        setSubCategories(category.subCategories);
      } catch (error) {
        console.log("Error fetching sub-categories:", error);
      }
    };
    fetchCategoryDetails();
  }, [id]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setOriginalImage(file);
    const imageUrl = URL.createObjectURL(file);
    setFormData({ ...formData, image: imageUrl });
  };

  // Handle form submission for add/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("category_id", id);
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("properties", JSON.stringify(formData.properties));
    if (originalImage) {
      data.append("image", originalImage);
    }

    const url = editMode
      ? `${process.env.baseUrl}${endpointsPath.subCategory}/${formData._id}`
      : `${process.env.baseUrl}${endpointsPath.subCategory}/create`;

    const method = editMode ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${requestHandler.getToken()}`,
        },
        body: data,
      });

      if (response.ok) {
        toast.success(`Sub-category ${editMode ? "updated" : "added"} successfully!`);
        setFormData({ name: "", description: "", properties: [], image: "" });
        setOriginalImage(null);
        setEditMode(false);
        const updatedCategory = await response.json();
        //setSubCategories(updatedCategory.subCategories);
      } else {
        toast.error("Failed to save sub-category.");
      }
    } catch (error) {
      console.log("Error saving sub-category:", error);
    }
  };

  // Handle delete
  const handleDelete = async (subCategoryId) => {
    if (!confirm("Are you sure you want to delete this sub-category?")) return;

    try {
      const response = await requestHandler.deleteReq(
        `${endpointsPath.subCategory}/${subCategoryId}`,
        true
      );
      if (response.statusCode === 200) {
        toast.success("Sub-category deleted successfully!");
        setSubCategories(subCategories.filter((sc) => sc._id !== subCategoryId));
      } else {
        toast.error("Failed to delete sub-category.");
      }
    } catch (error) {
      console.log("Error deleting sub-category:", error);
    }
  };

  // Handle edit
  const handleEdit = (subCategory) => {
    setFormData({ ...subCategory, properties: formatJsonArrayAsTags(JSON.stringify(subCategory?.properties?.join(", "))) });
    setEditMode(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Manage Sub-Categories: {categoryName}</h1>

      {/* Form for Add / Edit */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          name="name"
          placeholder="Sub-category Name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="w-full border rounded-lg p-2"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleInputChange}
          className="w-full border rounded-lg p-2"
        ></textarea>
        <input
          type="text"
          name="properties"
          placeholder="Properties (comma-separated)"
          value={formData.properties}
          onChange={(e) =>
            setFormData({ ...formData, properties: e.target.value.split(",").map((p) => p.trim()) })
          }
          className="w-full border rounded-lg p-2"
        />
        <input type="file" accept="image/*" onChange={handleImageChange} className="w-full border rounded-lg p-2" />
        {formData.image && <img src={formData.image} alt="Preview" className="w-32 h-32 object-cover rounded-lg mt-4" />}
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          {editMode ? "Update Sub-Category" : "Add Sub-Category"}
        </button>
      </form>

      {/* Sub-Category List */}
      <ul className="mt-6 space-y-4">
        {subCategories.map((subCategory) => (
          <li key={subCategory._id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="">
              <h3 className="font-medium">{subCategory.name}</h3>
              <p>{truncateText(subCategory.description, 20)}</p>
              <p className="text-sm text-gray-500">Properties: {truncateText(formatJsonArrayAsTags(JSON.stringify(subCategory?.properties?.join(", "))), 20)}</p>
            </div>
            <div className="flex items-center gap-4">
              {subCategory.image && (
                <img
                  src={formatImagePath(subCategory.image)}
                  alt={subCategory.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <button
                onClick={() => handleEdit(subCategory)}
                className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(subCategory._id)}
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SubCategoryManagement
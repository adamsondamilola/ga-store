import { useState, useEffect, useRef } from "react";
import requestHandler from "../../../../utils/requestHandler";
import endpointsPath from "../../../../constants/EndpointsPath";
import { toast } from "react-toastify";
import { formatImagePath } from "../../../../utils/formatImagePath";

export default function BrandManagement() {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);  
  const [categorySelected, setCategorySelected] = useState(null);  
  const [formData, setFormData] = useState({
    category_id: "",
    category_name: "",
    name: "",
    image: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const ref = useRef(null);

  // Fetch brands, categories, and sub-categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandRes, categoryRes] = await Promise.all([
          requestHandler.get(endpointsPath.brand, true),
          requestHandler.get(endpointsPath.subCategory, true),
        ]);
        setBrands(brandRes.result.data);
        setCategories(categoryRes.result.data);
      } catch (error) {
        console.log("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);


  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    //filter to get category name
    const cat = categories.filter(x => x._id == e.target.value)
    //setFormData({ ...formData, 'category_name': cat[0].name });
    setCategorySelected(cat[0].name)
    setCategoryId(e.target.value)
  };

  // Handle file input change for image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setOriginalImage(file);
    const imageUrl = URL.createObjectURL(file);
    setFormData({ ...formData, image: imageUrl });
  };

  // Handle form submission for add or update
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("category_id", categoryId);
    data.append("category_name", categorySelected);
    data.append("name", formData.name);
    data.append("image", originalImage);

    const method = editMode ? "PUT" : "POST";
    const url = editMode
      ? `${process.env.baseUrl}${endpointsPath.brand}/${selectedBrand._id}`
      : `${process.env.baseUrl}${endpointsPath.brand}/create`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: "Bearer " + requestHandler.getToken(),
        },
        body: data,
      });

      if (response.ok) {
        toast.success(`Brand ${editMode ? "updated" : "added"} successfully!`);
        setFormData({ category_id: "", category_name: "", name: "", image: "" });
        setEditMode(false);
        setSelectedBrand(null);
        const updatedBrands = await response.json();
        setBrands(updatedBrands.result.data);
      } else {
        toast.error("Failed to save brand");
      }
    } catch (error) {
      console.log("Error saving brand:", error);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    try {
      const response = await requestHandler.deleteReq(`${endpointsPath.brand}/${id}`, true);
      if (response.statusCode === 200) {
        toast.success("Brand deleted successfully!");
        setBrands(brands.filter((brand) => brand._id !== id));
      } else {
        toast.error("Failed to delete brand");
      }
    } catch (error) {
      console.log("Error deleting brand:", error);
    }
  };

  // Handle edit
  const handleEdit = (brand) => {
    setFormData({
      category_id: brand.category_id,
      category_name: brand.category_name || "",
      name: brand.name,
      image: brand.image,
    });
    setEditMode(true);
    setCategorySelected(brand.category_name || "")
    setCategoryId(brand.category_id)
    setSelectedBrand(brand);
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={ref} className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Brand Management</h1>

      {/* Add / Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 font-medium text-gray-700">Category</label>
          <select
            name="category_id"
            //value={formData.category_id}
            onChange={handleInputChange}
            required
            className="w-full border rounded-lg p-2"
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Brand Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border rounded-lg p-2"
          />
          {formData.image && (
            <img
              src={formData.image}
              alt="Preview"
              className="mt-4 w-32 h-32 object-cover rounded-lg"
            />
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600"
        >
          {editMode ? "Update Brand" : "Add Brand"}
        </button>
      </form>

      {/* Brand List */}
      <div className="mt-8">
        <h2 className="text-2xl font-medium mb-4">Brand List</h2>
        <ul className="space-y-4">
          {brands.map((brand) => (
            <li
              key={brand._id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{brand.name}</h3>
                <p className="text-sm text-gray-500">Category: {brand.category_name}</p>
              </div>
              <div className="flex items-center gap-4">
                {brand.image && (
                  <img
                    src={`${formatImagePath(brand.image)}`}
                    alt={brand.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <button
                  onClick={() => handleEdit(brand)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(brand._id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

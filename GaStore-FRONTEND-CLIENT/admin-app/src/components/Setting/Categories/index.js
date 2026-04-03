import { useState, useEffect, useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import requestHandler from "../../../../utils/requestHandler";
import endpointsPath from "../../../../constants/EndpointsPath";
import { toast } from "react-toastify";
import { truncateText } from "../../../../utils/truncateText";
import { formatImagePath } from "../../../../utils/formatImagePath";
import { useRouter } from "next/navigation";
import Spinner from "../../../../utils/loader";

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [formData, setFormData] = useState({ name: "", description: "", image: "", order: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newImage, setNewImage] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const router = useRouter();
  const ref = useRef(null);

  // Fetch categories
  const fetchCategories = async (newPage = 1) => {
    setLoading(true)
    try {
      const response = await requestHandler.get(
        `${endpointsPath.subCategory}/all/paginate?page=${newPage}`,
        true
      );
      const newCategories = response.result.data.result;

      setCategories((prev) => (newPage === 1 ? newCategories : [...prev, ...newCategories]));
      setFilteredCategories((prev) => (newPage === 1 ? newCategories : [...prev, ...newCategories]));
      setHasMore(newCategories.length > 0); // Stop when no more categories
    } catch (error) {
      console.log("Error fetching categories:", error);
    }
    finally{
        setLoading(false)
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle search
  useEffect(() => {
    const searchResult = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCategories(searchResult);
  }, [searchQuery, categories]);

  // Redirect on image click
  const handleImageClick = (categoryId) => {
    router.push(`/admin/setting/categories/${categoryId}`);
  };

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
      };
    
      // Handle file input change for image upload
      const handleImageChange = (e) => {
        const file = e.target.files[0];
        setOriginalImage(file)
        const imageUrl = URL.createObjectURL(file);
        setFormData({ ...formData, image: imageUrl });
        setNewImage(true)
      };
    
      // Handle form submission for add or update
      const handleSubmit = async (e) => {
        
        e.preventDefault();
        setLoading(true)
    
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('order', formData.order);
        data.append('image', originalImage);
    
        const method = editMode ? "PUT" : "POST";
        const url = editMode ? `${process.env.baseUrl}${endpointsPath.subCategory}/${selectedCategory._id}` : `${process.env.baseUrl}${endpointsPath.subCategory}/create`;
    
        try {
          const response = await fetch(url, {
            method,
            headers: { 
                //"Content-Type": "application/json", 
                "Authorization": "Bearer "+requestHandler.getToken() 
            }, 
            body: data,
          });
    
          if (response.ok) {
            toast.success(`Category ${editMode ? "updated" : "added"} successfully!`);
            setFormData({ name: "", description: "", image: "", order: "" });
            setEditMode(false);
            setSelectedCategory(null);
            //const updatedCategories = await response.json();
            //setCategories(updatedCategories);
          } else {
            toast.error("Failed to save category");
          }
        } catch (error) {
          console.log("Error saving category:", error);
        }
        finally{
            setLoading(false)
        }
      };
    
      // Handle delete
      const handleDelete = async (id) => {
        setLoading(true)
        if (!confirm("Are you sure you want to delete this category?")) return;
    
        try {
          const response = await requestHandler.deleteReq(`${endpointsPath.subCategory}/${id}`, true);
    
          if (response.statusCode == 200) {
            toast.success("Category deleted successfully!");
            setCategories(categories.filter((category) => category._id !== id));
          } else {
            toast.error("Failed to delete category");
          }
        } catch (error) {
          console.log("Error deleting category:", error);
        }
        finally{
            setLoading(false)
        }
        
      };
    
      // Handle edit
      const handleEdit = (category) => {
        setFormData(category);
        setEditMode(true);
        setSelectedCategory(category);
        ref.current?.scrollIntoView({behavior: 'smooth'})
      };


  return (
    <div ref={ref} className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Category Management</h1>

      {/* Add / Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 font-medium text-gray-700">Name</label>
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
          <label className="block mb-2 font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full border rounded-lg p-2"
          ></textarea>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Order</label>
          <input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleInputChange}
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
          {formData.image && <img src={formData.image} alt="Preview" className="mt-4 w-32 h-32 object-cover rounded-lg" />}
        </div>

       {loading? <Spinner loading={loading} /> : <button
          type="submit"
          className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600"
        >
          {editMode ? "Update Category" : "Add Category"}
        </button> }
      </form>

      {/* Search Box */}
      <input
        type="text"
        placeholder="Search categories..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mt-6 w-full border rounded-lg p-2 mb-6"
      />


      {/* Infinite Scroll for Category List */}
      <InfiniteScroll
        dataLength={filteredCategories.length}
        next={() => {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchCategories(nextPage);
        }}
        hasMore={hasMore}
        loader={<p>Loading...</p>}
        endMessage={<p className="text-center text-gray-500">No more categories</p>}
      >
        <ul className="space-y-4">
        {filteredCategories.map((category) => (
              <li key={category._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  <p>{truncateText(category.description, 30)}</p>
                  <p className="text-sm text-gray-500">Order: {category.order}</p>
                </div>
                <div className="flex items-center gap-4">
                  {category.image && 
                  <img 
                  src={`${formatImagePath(category.image)}`} 
                  alt={category.name} 
                  className="w-16 h-16 object-cover rounded-lg" 
                  onClick={() => handleImageClick(category._id)}
                  />}
                  <button
                    onClick={() => handleEdit(category)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Delete
                  </button>                  
                </div>
              </li>
            ))}
        </ul>
      </InfiniteScroll>
    </div>
  );
}

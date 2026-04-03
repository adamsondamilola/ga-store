import { useEffect, useState } from "react";
import {
  fetchBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "./BrandService";
import BrandItem from "./BrandItem";
import BrandModal from "./BrandModal";
import Pagination from "../../Pagination";
import { toast } from "react-toastify";
import ClassStyle from "../../../class-styles";
//import Pagination from "./Pagination"; // ✅ import here

export default function BrandList() {
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  const loadBrands = async () => {
    const res = await fetchBrands(searchTerm, page, pageSize);
    // Adjust depending on your API structure
    setBrands(res.data || []);
    setTotalPages(res.totalPages || 1); // Make sure your API returns totalPages
  };

  useEffect(() => {
    loadBrands();
  }, [page, searchTerm]);

  const handleCreateOrEdit = async (data) => {
    if (editingBrand) {
      await updateBrand(editingBrand.id, data);
    } else {
      await createBrand(data);
    }
    setModalOpen(false);
    setEditingBrand(null);
    loadBrands();
  };

  const handleDelete = async (id) => {
    try {
      const message = await deleteBrand(id);
      toast.success(message);
      loadBrands();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1); // Reset to page 1 on search
          }}
          className={ClassStyle.input2}
        />
        <button
          onClick={() => {
            setModalOpen(true);
            setEditingBrand(null);
          }}
          className={ClassStyle.button}
        >
          + New Brand
        </button>
      </div>

      <div className="space-y-2">
        {brands.map((brand) => (
          <BrandItem
            key={brand.id}
            brand={brand}
            onEdit={(b) => {
              setEditingBrand(b);
              setModalOpen(true);
            }}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <BrandModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBrand(null);
        }}
        onSubmit={handleCreateOrEdit}
        initialData={editingBrand}
      />
    </div>
  );
}

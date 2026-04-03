import { useEffect, useState } from "react";
import {
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
} from "./TagService";
import TagItem from "./TagItem";
import TagModal from "./TagModal";
import Pagination from "../../Pagination";
import { toast } from "react-toastify";
import ClassStyle from "../../../class-styles";

export default function TagList() {
  const [tags, setTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  const loadTags = async () => {
    const res = await fetchTags(searchTerm, page, pageSize);
    // Adjust depending on your API structure
    setTags(res.data || []);
    setTotalPages(res.totalPages || 1); // Make sure your API returns totalPages
  };

  useEffect(() => {
    loadTags();
  }, [page, searchTerm]);

  const handleCreateOrEdit = async (data) => {
    if (editingTag) {
      await updateTag(editingTag.id, data);
    } else {
      await createTag(data);
    }
    setModalOpen(false);
    setEditingTag(null);
    loadTags();
  };

  const handleDelete = async (id) => {
    try {
      const message = await deleteTag(id);
      toast.success(message);
      loadTags();
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
            setEditingTag(null);
          }}
          className={ClassStyle.button}
        >
          + New Tag
        </button>
      </div>

      <div className="space-y-2">
        {tags.map((tag) => (
          <TagItem
            key={tag.id}
            tag={tag}
            onEdit={(b) => {
              setEditingTag(b);
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

      <TagModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTag(null);
        }}
        onSubmit={handleCreateOrEdit}
        initialData={editingTag}
      />
    </div>
  );
}

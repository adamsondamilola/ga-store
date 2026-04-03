import BrandForm from "./BrandForm";

export default function BrandModal({ isOpen, onClose, onSubmit, initialData }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">{initialData ? "Edit Brand" : "New Brand"}</h2>
        <BrandForm initialData={initialData} onSubmit={onSubmit} />
        <button onClick={onClose} className="mt-4 text-gray-600">Close</button>
      </div>
    </div>
  );
}

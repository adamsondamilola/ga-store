export default function BrandItem({ brand, onEdit, onDelete }) {
    return (
      <div className="flex text-start justify-between items-center border p-4 rounded">
        <div className="">
          <h3 className="font-bold">{brand?.name}</h3>
          <p className="text-start">{brand.code}</p>
          {brand?.logoUrl && <img src={brand?.logoUrl} alt={brand?.name} className="w-12 h-12 rounded-lg object-contain" />}
        </div>
        <div className="space-x-2">
          <button onClick={() => onEdit(brand)} className="text-blue-500">Edit</button>
          <button onClick={() => onDelete(brand?.id)} className="text-red-500">Delete</button>
        </div>
      </div>
    );
  }  
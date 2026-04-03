export default function TagItem({ tag, onEdit, onDelete }) {
    return (
      <div className="flex justify-between text-start items-center border p-4 rounded">
        <div className="">
          <h3 className="font-bold">{tag?.name}</h3>
          <p className="text-start">{tag.description}</p>
        </div>
        <div className="space-x-2">
          <button onClick={() => onEdit(tag)} className="text-blue-500">Edit</button>
          <button onClick={() => onDelete(tag?.id)} className="text-red-500">Delete</button>
        </div>
      </div>
    );
  }  
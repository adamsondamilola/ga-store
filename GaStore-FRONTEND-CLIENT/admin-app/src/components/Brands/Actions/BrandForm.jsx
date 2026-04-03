import { useState } from "react";
import ClassStyle from "../../../class-styles";

export default function BrandForm({ initialData = {}, onSubmit }) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    logoUrl: initialData?.logoUrl || "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} className={ClassStyle.input} />
      <input name="code" placeholder="Code" value={form.code} onChange={handleChange} className={ClassStyle.input} />
      <input name="logoUrl" placeholder="Logo URL" value={form.logoUrl} onChange={handleChange} className={ClassStyle.input} />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
    </form>
  );
}

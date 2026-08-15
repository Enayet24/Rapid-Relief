import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

const CATEGORIES = ["food", "water", "medicine", "clothing", "other"];

export default function ResourceInventory() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: "food", name: "", quantity: 0, unit: "" });

  const load = () => {
    axiosClient.get("/resources").then((res) => setResources(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await axiosClient.post("/resources", { ...form, quantity: Number(form.quantity) });
    setForm({ category: "food", name: "", quantity: 0, unit: "" });
    load();
  };

  if (loading) return <span className="loading loading-spinner loading-lg" />;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="card bg-base-100 shadow-md p-4 flex flex-row flex-wrap gap-3 items-end">
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="select select-bordered"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          placeholder="Item name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input input-bordered"
          required
        />
        <input
          type="number"
          min="0"
          placeholder="Quantity"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          className="input input-bordered w-28"
        />
        <input
          placeholder="Unit (kg, liters...)"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          className="input input-bordered w-40"
          required
        />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Category</th><th>Item</th><th>Quantity</th><th>Shelter</th><th>Status</th></tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r._id}>
                <td className="capitalize">{r.category}</td>
                <td>{r.name}</td>
                <td>{r.quantity} {r.unit}</td>
                <td>{r.shelter?.name || "Central warehouse"}</td>
                <td>
                  {r.isLowStock
                    ? <span className="badge badge-error">Low stock</span>
                    : <span className="badge badge-success">OK</span>}
                </td>
              </tr>
            ))}
            {resources.length === 0 && (
              <tr><td colSpan={5} className="text-center py-6 opacity-60">No resources yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
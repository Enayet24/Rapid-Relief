import { useEffect, useState, useMemo, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import Pagination from "../components/Pagination";

const CATEGORIES = ["food", "water", "medicine", "clothing", "shelter", "other"];

export default function ResourceInventory() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ category: "food", name: "", quantity: 0, unit: "", lowStockThreshold: 10 });
  const [formLoading, setFormLoading] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadResources = useCallback(() => {
    setLoading(true);
    axiosClient
      .get("/resources")
      .then((res) => setResources(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load inventory"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await axiosClient.post("/resources", {
        ...form,
        quantity: Number(form.quantity),
        lowStockThreshold: Number(form.lowStockThreshold) || 10,
      });
      setForm({ category: "food", name: "", quantity: 0, unit: "", lowStockThreshold: 10 });
      loadResources();
    } catch (err) {
      alert("Failed to add resource: " + (err.response?.data?.message || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || r.category === categoryFilter;
      const matchesLowStock = !onlyLowStock || r.quantity <= (r.lowStockThreshold || 10);
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [resources, search, categoryFilter, onlyLowStock]);

  const totalPages = Math.ceil(filteredResources.length / itemsPerPage) || 1;
  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredResources.slice(start, start + itemsPerPage);
  }, [filteredResources, currentPage, itemsPerPage]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-base-content flex items-center gap-2">
            <span>📦 Disaster Resource Inventory</span>
            <span className="badge badge-sm badge-ghost">{resources.length} Items</span>
          </h1>
          <p className="text-xs text-base-content/70">
            Monitor relief supplies, emergency rations, medical kits, and low-stock alerts.
          </p>
        </div>

        <button onClick={loadResources} className="btn btn-sm btn-ghost">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-error text-xs py-2">{error}</div>}

      {/* Add Resource Form Card */}
      <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-base-content/80 mb-3">
          ➕ Register New Supply Batch
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-end">
          <div className="form-control">
            <label className="label py-0.5"><span className="label-text text-xs">Category</span></label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="select select-sm select-bordered w-full capitalize text-xs"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-control lg:col-span-2">
            <label className="label py-0.5"><span className="label-text text-xs">Item Name</span></label>
            <input
              placeholder="e.g. Water Purification Tablets"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input input-sm input-bordered w-full text-xs"
              required
            />
          </div>

          <div className="form-control">
            <label className="label py-0.5"><span className="label-text text-xs">Quantity</span></label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="input input-sm input-bordered w-full text-xs"
              required
            />
          </div>

          <div className="form-control">
            <label className="label py-0.5"><span className="label-text text-xs">Unit</span></label>
            <input
              placeholder="boxes, kg, liters"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="input input-sm input-bordered w-full text-xs"
              required
            />
          </div>

          <button type="submit" disabled={formLoading} className="btn btn-sm btn-primary w-full">
            {formLoading ? "Adding..." : "Add Supply"}
          </button>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="card bg-base-100 border border-base-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <input
            type="text"
            placeholder="🔍 Search item name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="input input-sm input-bordered w-full text-xs"
          />

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select select-sm select-bordered w-full text-xs capitalize"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label className="label cursor-pointer justify-start gap-2 py-0">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => {
                setOnlyLowStock(e.target.checked);
                setCurrentPage(1);
              }}
              className="checkbox checkbox-warning checkbox-sm"
            />
            <span className="label-text text-xs font-semibold text-warning">
              ⚠️ Show Low Stock Only
            </span>
          </label>
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="card bg-base-100 border border-base-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[200px]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : paginatedResources.length === 0 ? (
            <div className="text-center py-10 text-xs text-base-content/60">
              No inventory items found.
            </div>
          ) : (
            <table className="table table-sm table-zebra w-full">
              <thead>
                <tr className="text-xs text-base-content/80">
                  <th>Category</th>
                  <th>Item Name</th>
                  <th>Quantity in Stock</th>
                  <th>Shelter Location</th>
                  <th>Stock Health</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResources.map((r) => {
                  const isLow = r.quantity <= (r.lowStockThreshold || 10);
                  return (
                    <tr key={r._id} className="hover text-xs">
                      <td className="capitalize font-semibold text-primary">{r.category}</td>
                      <td className="font-bold text-base-content">{r.name}</td>
                      <td>
                        <span className="text-sm font-black">{r.quantity.toLocaleString()}</span>{" "}
                        <span className="text-base-content/70">{r.unit}</span>
                      </td>
                      <td className="text-base-content/70">
                        {r.shelter?.name || "Central Relief Warehouse"}
                      </td>
                      <td>
                        {isLow ? (
                          <span className="badge badge-warning text-black font-bold badge-xs">
                            ⚠️ Low Stock (≤{r.lowStockThreshold || 10})
                          </span>
                        ) : (
                          <span className="badge badge-success text-white font-semibold badge-xs">
                            ✓ Adequate
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-base-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredResources.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
            onItemsPerPageChange={(l) => {
              setItemsPerPage(l);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
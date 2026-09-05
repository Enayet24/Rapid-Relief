import { useEffect, useState, useMemo, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import Pagination from "../components/Pagination";

const STATUS_BADGE = {
  pending: "badge-ghost",
  received: "badge-info text-white",
  allocated: "badge-success text-white",
};

const NEXT_STATUS = {
  pending: "received",
  received: "allocated",
};

export default function DonationList() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ donorName: "", donationType: "cash", amount: "", itemDescription: "", quantity: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Module 2: search & filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Module 2: pagination, matching the pattern used on ShelterList/ResourceInventory
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const load = useCallback(() => {
    setLoading(true);
    axiosClient
      .get("/donations")
      .then((res) => setDonations(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load donations"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await axiosClient.post("/donations", {
        donorName: form.donorName,
        donationType: form.donationType,
        amount: form.amount ? Number(form.amount) : undefined,
        itemDescription: form.itemDescription,
        quantity: form.quantity ? Number(form.quantity) : undefined,
      });
      setForm({ donorName: "", donationType: "cash", amount: "", itemDescription: "", quantity: "" });
      load();
    } catch (err) {
      alert("Failed to record donation: " + (err.response?.data?.message || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  // Module 2: advance a donation to its next status (pending -> received -> allocated).
  // Allocated goods donations already auto-restock the linked resource on the backend.
  const handleAdvanceStatus = async (donation) => {
    const nextStatus = NEXT_STATUS[donation.status];
    if (!nextStatus) return;
    setUpdatingId(donation._id);
    try {
      await axiosClient.patch(`/donations/${donation._id}/status`, { status: nextStatus });
      load();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const matchesSearch = d.donorName.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || d.donationType === typeFilter;
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [donations, search, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage) || 1;
  const paginatedDonations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDonations.slice(start, start + itemsPerPage);
  }, [filteredDonations, currentPage, itemsPerPage]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-base-content flex items-center gap-2">
            <span>🤝 Donation Records</span>
            <span className="badge badge-sm badge-ghost">{donations.length} Donations</span>
          </h1>
          <p className="text-xs text-base-content/70">
            Log cash and goods donations, and track them through to allocation.
          </p>
        </div>
        <button onClick={load} className="btn btn-sm btn-ghost">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-error text-xs py-2">{error}</div>}

      {/* Add Donation Form */}
      <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-base-content/80 mb-3">
          ➕ Record New Donation
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
          <div className="form-control lg:col-span-2">
            <label className="label py-0.5"><span className="label-text text-xs">Donor Name</span></label>
            <input
              placeholder="Donor name"
              value={form.donorName}
              onChange={(e) => setForm({ ...form, donorName: e.target.value })}
              className="input input-sm input-bordered w-full text-xs"
              required
            />
          </div>

          <div className="form-control">
            <label className="label py-0.5"><span className="label-text text-xs">Type</span></label>
            <select
              value={form.donationType}
              onChange={(e) => setForm({ ...form, donationType: e.target.value })}
              className="select select-sm select-bordered w-full text-xs"
            >
              <option value="cash">Cash</option>
              <option value="goods">Goods</option>
            </select>
          </div>

          {form.donationType === "cash" ? (
            <div className="form-control lg:col-span-2">
              <label className="label py-0.5"><span className="label-text text-xs">Amount</span></label>
              <input
                type="number"
                min="0"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input input-sm input-bordered w-full text-xs"
              />
            </div>
          ) : (
            <>
              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-xs">Item</span></label>
                <input
                  placeholder="e.g. Blankets"
                  value={form.itemDescription}
                  onChange={(e) => setForm({ ...form, itemDescription: e.target.value })}
                  className="input input-sm input-bordered w-full text-xs"
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
                />
              </div>
            </>
          )}

          <button type="submit" disabled={formLoading} className="btn btn-sm btn-primary w-full lg:col-span-5">
            {formLoading ? "Saving..." : "Record Donation"}
          </button>
        </form>
      </div>

      {/* Search & Filter Bar */}
      <div className="card bg-base-100 border border-base-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="🔍 Search donor name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="input input-sm input-bordered w-full text-xs"
          />

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select select-sm select-bordered w-full text-xs"
          >
            <option value="all">All Types</option>
            <option value="cash">Cash</option>
            <option value="goods">Goods</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select select-sm select-bordered w-full text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
            <option value="allocated">Allocated</option>
          </select>
        </div>
      </div>

      {/* Donations Table */}
      <div className="card bg-base-100 border border-base-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[200px]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : paginatedDonations.length === 0 ? (
            <div className="text-center py-10 text-xs text-base-content/60">
              No donations match your criteria.
            </div>
          ) : (
            <table className="table table-sm table-zebra w-full">
              <thead>
                <tr className="text-xs text-base-content/80">
                  <th>Donor</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDonations.map((d) => (
                  <tr key={d._id} className="hover text-xs">
                    <td className="font-bold">{d.donorName}</td>
                    <td className="capitalize">{d.donationType}</td>
                    <td>{d.donationType === "cash" ? `৳${d.amount}` : `${d.quantity} × ${d.itemDescription}`}</td>
                    <td>
                      <span className={`badge badge-xs capitalize ${STATUS_BADGE[d.status] || "badge-ghost"}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="text-base-content/70">{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td>
                      {NEXT_STATUS[d.status] ? (
                        <button
                          onClick={() => handleAdvanceStatus(d)}
                          disabled={updatingId === d._id}
                          className="btn btn-xs btn-outline btn-primary"
                        >
                          {updatingId === d._id ? "..." : `Mark ${NEXT_STATUS[d.status]}`}
                        </button>
                      ) : (
                        <span className="text-base-content/40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-3 border-t border-base-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDonations.length}
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

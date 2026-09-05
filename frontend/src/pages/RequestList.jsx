import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import Pagination from "../components/Pagination";
import { useAuth } from "../context/AuthContext";

const PRIORITY_BADGE = {
  critical: "badge-error text-white font-bold",
  high: "badge-warning text-black font-semibold",
  medium: "badge-info text-white",
  low: "badge-ghost",
};

const STATUS_BADGE = {
  pending: "badge-warning",
  assigned: "badge-info",
  in_progress: "badge-primary",
  resolved: "badge-success text-white",
  cancelled: "badge-ghost line-through opacity-70",
};

export default function RequestList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const canNavigate = user?.role === "volunteer" || user?.role === "admin";

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        priorityLevel: priorityFilter !== "all" ? priorityFilter : undefined,
      };

      const res = await axiosClient.get("/requests", { params });

      if (res.data.requests) {
        setRequests(res.data.requests);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      } else if (Array.isArray(res.data)) {
        setRequests(res.data);
        setTotalPages(1);
        setTotalItems(res.data.length);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load emergency requests");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-base-content flex items-center gap-2">
            <span>🚨 Emergency Assistance Requests</span>
            <span className="badge badge-sm badge-ghost">{totalItems} Records</span>
          </h1>
          <p className="text-xs text-base-content/70">
            {user?.role === "citizen"
              ? "All emergency assistance requests submitted from your account."
              : "Platform-wide emergency incident queue with real-time status tracking."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === "citizen" && (
            <Link to="/requests/new" className="btn btn-sm btn-error text-white font-bold">
              🆘 Report Emergency
            </Link>
          )}
          <Link to="/map" className="btn btn-sm btn-ghost">
            🗺️ Live Map
          </Link>
          <button onClick={fetchRequests} className="btn btn-sm btn-ghost">
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error text-xs py-2">{error}</div>}

      {/* Filter and Search Toolbar */}
      <div className="card bg-base-100 border border-base-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="🔍 Search location or keyword..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="input input-sm input-bordered w-full text-xs"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select select-sm select-bordered w-full text-xs capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select select-sm select-bordered w-full text-xs capitalize"
          >
            <option value="all">All Priorities</option>
            <option value="critical">🔴 Critical Priority</option>
            <option value="high">🟠 High Priority</option>
            <option value="medium">🔵 Medium Priority</option>
            <option value="low">⚪ Low Priority</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="card bg-base-100 border border-base-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[200px]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10 text-xs text-base-content/60">
              No emergency requests found.
            </div>
          ) : (
            <table className="table table-sm table-zebra w-full">
              <thead>
                <tr className="text-xs text-base-content/80">
                  <th>Disaster</th>
                  <th>Assistance</th>
                  <th>Affected</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Submitted</th>
                  {canNavigate && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id} className="hover text-xs">
                    <td className="capitalize font-bold flex items-center gap-1.5">
                      <span>{r.disasterType === "flood" ? "🌊" : r.disasterType === "fire" ? "🔥" : "🚨"}</span>
                      <span>{r.disasterType}</span>
                    </td>
                    <td className="capitalize font-medium text-primary">{r.assistanceTypeRequired}</td>
                    <td className="font-semibold">{r.numberOfAffectedIndividuals} people</td>
                    <td>
                      <span className={`badge badge-xs ${PRIORITY_BADGE[r.priorityLevel] || "badge-ghost"}`}>
                        {r.priorityLevel}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-xs ${STATUS_BADGE[r.status] || "badge-ghost"} capitalize`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="truncate max-w-[160px] text-base-content/70" title={r.location?.address}>
                      📍 {r.location?.address || "Coordinates"}
                    </td>
                    <td className="text-base-content/60 text-[11px]">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    {canNavigate && (
                      <td>
                        <Link to={`/requests/${r._id}/navigate`} className="btn btn-xs btn-primary">
                          🧭 Navigate
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-base-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
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
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import Pagination from "../components/Pagination";
import { useAuth } from "../context/AuthContext";

const STATUS_BADGE = {
  open: "badge-success text-white font-semibold",
  full: "badge-error text-white font-semibold",
  closed: "badge-ghost opacity-70",
};

export default function ShelterList() {
  const { user } = useAuth();
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Client pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => {
    axiosClient
      .get("/shelters")
      .then((res) => setShelters(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load shelters"))
      .finally(() => setLoading(false));
  }, []);

  const filteredShelters = useMemo(() => {
    return shelters.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.location?.address || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [shelters, search, statusFilter]);

  const totalPages = Math.ceil(filteredShelters.length / itemsPerPage) || 1;
  const paginatedShelters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredShelters.slice(start, start + itemsPerPage);
  }, [filteredShelters, currentPage, itemsPerPage]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-base-content flex items-center gap-2">
            <span>🏠 Emergency Shelters Directory</span>
            <span className="badge badge-sm badge-ghost">{shelters.length} Shelters</span>
          </h1>
          <p className="text-xs text-base-content/70">
            Real-time shelter occupancy, medical facilities, and emergency contact details.
          </p>
        </div>

        {user?.role === "admin" && (
          <Link to="/shelters/new" className="btn btn-sm btn-primary">
            ➕ Add Shelter
          </Link>
        )}
      </div>

      {error && <div className="alert alert-error text-xs py-2">{error}</div>}

      {/* Filter Bar */}
      <div className="card bg-base-100 border border-base-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="🔍 Search shelter name or address..."
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
            className="select select-sm select-bordered w-full text-xs"
          >
            <option value="all">All Shelter Statuses</option>
            <option value="open">🟢 Open (Available Space)</option>
            <option value="full">🔴 Full Capacity</option>
            <option value="closed">⚪ Closed</option>
          </select>
        </div>
      </div>

      {/* Shelters Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : paginatedShelters.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-2xl border border-base-200 text-xs text-base-content/60">
          No emergency shelters match your criteria.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedShelters.map((s) => {
            const occupancyPct = s.capacity > 0 ? Math.round((s.currentOccupancy / s.capacity) * 100) : 0;
            const isFull = s.status === "full" || occupancyPct >= 100;

            return (
              <div key={s._id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all">
                <div className="card-body p-5">
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="card-title text-base font-bold text-base-content">{s.name}</h2>
                    <span className={`badge badge-sm uppercase ${STATUS_BADGE[s.status] || "badge-ghost"}`}>
                      {s.status}
                    </span>
                  </div>

                  <p className="text-xs text-base-content/70 mt-1 flex items-center gap-1">
                    <span>📍</span>
                    <span className="truncate">{s.location?.address || "Address specified"}</span>
                  </p>

                  <div className="my-3 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Occupancy ({occupancyPct}%)</span>
                      <span className={isFull ? "text-error font-bold" : "text-base-content/80"}>
                        {s.currentOccupancy} / {s.capacity} spots
                      </span>
                    </div>

                    <progress
                      className={`progress w-full h-2 ${isFull ? "progress-error" : occupancyPct >= 75 ? "progress-warning" : "progress-success"}`}
                      value={s.currentOccupancy}
                      max={s.capacity || 1}
                    />
                  </div>

                  {s.contactPhone && (
                    <div className="text-xs text-base-content/80 pt-1">
                      📞 <span className="font-semibold">{s.contactPhone}</span>
                    </div>
                  )}

                  {s.facilities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-base-200">
                      {s.facilities.map((f) => (
                        <span key={f} className="badge badge-outline badge-xs capitalize">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredShelters.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(p) => setCurrentPage(p)}
        onItemsPerPageChange={(l) => {
          setItemsPerPage(l);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import StatCard from "../components/StatCard";
import {
  DisasterBreakdownChart,
  PriorityDistributionMeter,
  ShelterOccupancyGauge,
  ResourceInventoryBreakdown,
} from "../components/VisualCharts";
import Pagination from "../components/Pagination";
import ReportModal from "../components/ReportModal";
import SMSBroadcastModal from "../components/SMSBroadcastModal";

const PRIORITY_BADGE_MAP = {
  critical: "badge-error text-white animate-pulse font-bold",
  high: "badge-warning text-black font-semibold",
  medium: "badge-info text-white",
  low: "badge-ghost",
};

const STATUS_BADGE_MAP = {
  pending: "badge-warning",
  assigned: "badge-info",
  in_progress: "badge-primary",
  resolved: "badge-success text-white",
  cancelled: "badge-ghost line-through opacity-70",
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("in_progress");
  const [statusNote, setStatusNote] = useState("");
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDisaster, setFilterDisaster] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch Dashboard Summary & Charts
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const res = await axiosClient.get("/analytics/dashboard");
      setSummary(res.data.summary);
      setCharts(res.data.charts);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard summary data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Filtered & Paginated Emergency Requests
  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        disasterType: filterDisaster !== "all" ? filterDisaster : undefined,
        priorityLevel: filterPriority !== "all" ? filterPriority : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
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
      console.error("Error fetching requests:", err);
    } finally {
      setRequestsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, filterDisaster, filterPriority, filterStatus]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Open Status Update Modal
  const openStatusModal = (req) => {
    setSelectedRequest(req);
    setNewStatus(req.status || "in_progress");
    setStatusNote("");
    setSelectedVolunteerId(req.assignedVolunteer?._id || req.assignedVolunteer || "");
    setStatusUpdateModalOpen(true);
  };

  // Submit Status / Assignment Update
  const handleSaveStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      await axiosClient.patch(`/requests/${selectedRequest._id}/status`, {
        status: newStatus,
        note: statusNote || `Status changed to ${newStatus}`,
        assignedVolunteer: selectedVolunteerId || null,
      });

      setStatusUpdateModalOpen(false);
      fetchRequests();
      fetchDashboardData();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm font-medium text-base-content/70">Loading Administrative Command Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Banner & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-100 p-4 sm:p-6 rounded-2xl border border-base-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-base-content">
              🛡️ Administrative Command Center
            </h1>
            <span className="badge badge-success badge-sm font-bold text-white">Live System</span>
          </div>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Real-time disaster coordination, emergency request monitoring, analytics, and SMS dispatch.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSMSModalOpen(true)}
            className="btn btn-sm btn-primary gap-1.5 shadow-sm"
          >
            <span>📱</span>
            <span>SMS Alerts</span>
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="btn btn-sm btn-outline btn-secondary gap-1.5"
          >
            <span>📑</span>
            <span>Generate Reports</span>
          </button>
          <button
            onClick={() => {
              fetchDashboardData();
              fetchRequests();
            }}
            className="btn btn-sm btn-ghost gap-1"
            title="Refresh Data"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error text-sm shadow-sm">
          <span>{error}</span>
        </div>
      )}

      {/* KPI Overview Metric Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Emergencies"
            value={summary.activeRequests || 0}
            subtext={`${summary.criticalRequests || 0} Critical • ${summary.highRequests || 0} High Priority`}
            icon="🚨"
            variant="error"
            badgeText={`${summary.totalRequests || 0} Total`}
            badgeType="badge-error text-white"
          />

          <StatCard
            title="Shelter Capacity"
            value={`${summary.overallOccupancyRate || 0}%`}
            subtext={`${summary.totalShelterOccupancy || 0} / ${summary.totalShelterCapacity || 0} spots occupied`}
            icon="🏠"
            variant={summary.overallOccupancyRate >= 80 ? "warning" : "success"}
            badgeText={`${summary.totalShelters || 0} Shelters`}
            badgeType="badge-primary"
          />

          <StatCard
            title="Victims Affected"
            value={summary.totalAffectedIndividuals?.toLocaleString() || 0}
            subtext={`${summary.resolvedRequests || 0} Incidents Resolved`}
            icon="👥"
            variant="primary"
            badgeText={`${summary.approvedVolunteers || 0} Responders`}
            badgeType="badge-info text-white"
          />

          <StatCard
            title="Inventory & Alerts"
            value={`${summary.lowStockCount || 0} Low Stock`}
            subtext={`${summary.totalResourceItems || 0} Supply Items • ${summary.totalDonations || 0} Donations`}
            icon="📦"
            variant={summary.lowStockCount > 0 ? "warning" : "info"}
            badgeText={summary.lowStockCount > 0 ? "⚠️ Alert" : "Normal"}
            badgeType={summary.lowStockCount > 0 ? "badge-warning" : "badge-ghost"}
          />
        </div>
      )}

      {/* Analytics & Visual Charts Grid */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DisasterBreakdownChart data={charts.disasterBreakdown} />
          <PriorityDistributionMeter data={charts.priorityDistribution} />
          <ShelterOccupancyGauge shelterData={charts.shelterOccupancy} />
          <ResourceInventoryBreakdown categories={charts.resourceCategories} />
        </div>
      )}

      {/* Real-time Emergency Request Monitoring Console */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-200 pb-4">
            <div>
              <h2 className="card-title text-base sm:text-lg font-bold flex items-center gap-2">
                <span>🚨 Emergency Request Monitor & Dispatch</span>
                <span className="badge badge-sm badge-ghost">{totalItems} Total Records</span>
              </h2>
              <p className="text-xs text-base-content/70">
                Filter by priority, disaster type, and status. Assign volunteers and update incident workflows.
              </p>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex flex-wrap gap-1">
              {["all", "pending", "assigned", "in_progress", "resolved"].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setFilterStatus(st);
                    setCurrentPage(1);
                  }}
                  className={`btn btn-xs ${filterStatus === st ? "btn-primary" : "btn-ghost"}`}
                >
                  {st === "all" ? "All" : st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filters Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 my-3">
            {/* Search Input */}
            <div className="form-control">
              <input
                type="text"
                placeholder="🔍 Search location or keyword..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="input input-sm input-bordered w-full text-xs"
              />
            </div>

            {/* Disaster Type Filter */}
            <div className="form-control">
              <select
                value={filterDisaster}
                onChange={(e) => {
                  setFilterDisaster(e.target.value);
                  setCurrentPage(1);
                }}
                className="select select-sm select-bordered w-full text-xs capitalize"
              >
                <option value="all">All Disaster Types</option>
                <option value="flood">🌊 Flood</option>
                <option value="cyclone">🌀 Cyclone</option>
                <option value="earthquake">🏚️ Earthquake</option>
                <option value="fire">🔥 Fire</option>
                <option value="landslide">⛰️ Landslide</option>
                <option value="other">⚠️ Other</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="form-control">
              <select
                value={filterPriority}
                onChange={(e) => {
                  setFilterPriority(e.target.value);
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

            {/* Clear Filters Button */}
            <div className="flex items-center">
              {(searchTerm || filterDisaster !== "all" || filterPriority !== "all" || filterStatus !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterDisaster("all");
                    setFilterPriority("all");
                    setFilterStatus("all");
                    setCurrentPage(1);
                  }}
                  className="btn btn-xs btn-outline btn-ghost w-full"
                >
                  Clear Filters ✕
                </button>
              )}
            </div>
          </div>

          {/* Requests Table */}
          <div className="overflow-x-auto min-h-[220px]">
            {requestsLoading ? (
              <div className="flex justify-center items-center py-12">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-10 bg-base-200/50 rounded-xl text-xs text-base-content/60">
                No emergency requests match the selected filters.
              </div>
            ) : (
              <table className="table table-sm table-zebra w-full">
                <thead>
                  <tr className="text-xs text-base-content/80">
                    <th>Disaster / Reason</th>
                    <th>Victims</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Reporter / Location</th>
                    <th>Volunteer</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r._id} className="hover">
                      <td>
                        <div className="font-bold capitalize text-sm flex items-center gap-1.5">
                          <span>{r.disasterType === "fire" ? "🔥" : r.disasterType === "flood" ? "🌊" : r.disasterType === "cyclone" ? "🌀" : "🚨"}</span>
                          <span>{r.disasterType}</span>
                        </div>
                        <div className="text-[11px] text-base-content/70 capitalize">
                          Needs: <span className="font-semibold text-primary">{r.assistanceTypeRequired}</span>
                        </div>
                      </td>

                      <td>
                        <span className="font-black text-sm">{r.numberOfAffectedIndividuals}</span>
                        <span className="text-[10px] text-base-content/60 block">people</span>
                      </td>

                      <td>
                        <span className={`badge badge-sm ${PRIORITY_BADGE_MAP[r.priorityLevel] || "badge-ghost"}`}>
                          {r.priorityLevel}
                        </span>
                      </td>

                      <td>
                        <span className={`badge badge-sm ${STATUS_BADGE_MAP[r.status] || "badge-ghost"} capitalize`}>
                          {r.status.replace("_", " ")}
                        </span>
                      </td>

                      <td>
                        <div className="font-medium text-xs text-base-content truncate max-w-[140px]">
                          {r.reporter?.name || "Anonymous Citizen"}
                        </div>
                        <div className="text-[11px] text-base-content/60 truncate max-w-[140px]" title={r.location?.address}>
                          📍 {r.location?.address || "Coordinates given"}
                        </div>
                      </td>

                      <td>
                        {r.assignedVolunteer ? (
                          <div className="text-xs font-semibold text-success flex items-center gap-1">
                            <span>🦺</span>
                            <span className="truncate max-w-[100px]">{r.assignedVolunteer.name}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-base-content/50 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="text-right">
                        <button
                          onClick={() => openStatusModal(r)}
                          className="btn btn-xs btn-outline btn-primary"
                        >
                          Manage ⚙️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Reusable Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(limit) => {
              setItemsPerPage(limit);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Incident Manage / Status & Volunteer Assignment Modal */}
      {statusUpdateModalOpen && selectedRequest && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-lg">
            <div className="flex justify-between items-center pb-3 border-b border-base-200">
              <h3 className="font-bold text-base text-base-content">
                ⚙️ Manage Incident #{String(selectedRequest._id).slice(-6)}
              </h3>
              <button onClick={() => setStatusUpdateModalOpen(false)} className="btn btn-xs btn-circle btn-ghost">✕</button>
            </div>

            <div className="p-3 bg-base-200 rounded-lg my-3 text-xs space-y-1">
              <div><span className="font-semibold">Disaster:</span> <span className="capitalize">{selectedRequest.disasterType} ({selectedRequest.assistanceTypeRequired})</span></div>
              <div><span className="font-semibold">Affected:</span> {selectedRequest.numberOfAffectedIndividuals} people</div>
              <div><span className="font-semibold">Location:</span> {selectedRequest.location?.address || "Coordinates given"}</div>
              <div><span className="font-semibold">Priority:</span> <span className="uppercase font-bold text-error">{selectedRequest.priorityLevel}</span></div>
              {selectedRequest.description && (
                <div className="pt-1 text-base-content/80 italic">"{selectedRequest.description}"</div>
              )}
            </div>

            <form onSubmit={handleSaveStatusUpdate} className="space-y-3">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Incident Status</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Status Update Note</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rescue team deployed with medical kits"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="input input-bordered input-sm text-xs"
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setStatusUpdateModalOpen(false)}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* SMS Broadcast Modal */}
      <SMSBroadcastModal
        isOpen={isSMSModalOpen}
        onClose={() => setIsSMSModalOpen(false)}
      />
    </div>
  );
}

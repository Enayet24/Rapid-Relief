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
import RequestTimeline from "../components/RequestTimeline";

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

  // Volunteer Management state
  const [volunteers, setVolunteers] = useState([]);
  const [volunteersLoading, setVolunteersLoading] = useState(false);
  const [volunteerFilter, setVolunteerFilter] = useState("all");

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("in_progress");
  const [statusNote, setStatusNote] = useState("");
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

  // Fetch Volunteers for Admin Management
  const fetchVolunteers = useCallback(async () => {
    setVolunteersLoading(true);
    try {
      const res = await axiosClient.get("/volunteers", {
        params: { status: volunteerFilter },
      });
      setVolunteers(res.data.volunteers || []);
    } catch (err) {
      console.error("Error fetching volunteers:", err);
    } finally {
      setVolunteersLoading(false);
    }
  }, [volunteerFilter]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  // Handle Volunteer Approval / Rejection
  const handleVolunteerStatusUpdate = async (volunteerId, status) => {
    try {
      await axiosClient.put(`/volunteers/${volunteerId}/status`, { status });
      fetchVolunteers();
      fetchDashboardData();
    } catch (err) {
      alert("Failed to update volunteer status: " + (err.response?.data?.message || err.message));
    }
  };

  // Open Status & Assignment Update Modal
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
      // If a volunteer was selected/changed, assign task
      if (selectedVolunteerId && selectedVolunteerId !== selectedRequest.assignedVolunteer?._id) {
        await axiosClient.put("/volunteers/assign-task", {
          requestId: selectedRequest._id,
          volunteerId: selectedVolunteerId,
        });
      }

      await axiosClient.patch(`/requests/${selectedRequest._id}/status`, {
        status: newStatus,
        note: statusNote || `Status changed to ${newStatus}`,
        assignedVolunteer: selectedVolunteerId || null,
      });

      setStatusUpdateModalOpen(false);
      fetchRequests();
      fetchDashboardData();
    } catch (err) {
      alert("Failed to update incident: " + (err.response?.data?.message || err.message));
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

  const approvedVolunteersList = volunteers.filter(
    (v) => v.volunteerStatus === "approved" || v.isApprovedVolunteer
  );

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
            Real-time disaster coordination, emergency request monitoring, volunteer management, and SMS dispatch.
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
              fetchVolunteers();
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

      {/* Volunteer Approval & Management Console */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-200 pb-4">
            <div>
              <h2 className="card-title text-base sm:text-lg font-bold flex items-center gap-2">
                <span>🦺 Volunteer Approval & Management Console</span>
                <span className="badge badge-sm badge-info text-white">
                  {volunteers.length} Volunteers
                </span>
              </h2>
              <p className="text-xs text-base-content/70">
                Review volunteer applications, approve rescue status, and inspect assigned tasks.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {["all", "pending", "approved", "rejected"].map((st) => (
                <button
                  key={st}
                  onClick={() => setVolunteerFilter(st)}
                  className={`btn btn-xs ${
                    volunteerFilter === st ? "btn-primary" : "btn-ghost"
                  } capitalize`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            {volunteersLoading ? (
              <div className="flex justify-center items-center py-8">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : volunteers.length === 0 ? (
              <div className="text-center py-6 text-xs text-base-content/60 bg-base-200/40 rounded-xl">
                No volunteers found matching current filter ({volunteerFilter}).
              </div>
            ) : (
              <table className="table table-sm table-zebra w-full text-xs">
                <thead>
                  <tr className="text-base-content/80">
                    <th>Name / Email</th>
                    <th>Phone</th>
                    <th>Skills</th>
                    <th>Status</th>
                    <th>Assigned Tasks</th>
                    <th className="text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((v) => {
                    const status = v.volunteerStatus || (v.isApprovedVolunteer ? "approved" : "pending");

                    return (
                      <tr key={v._id}>
                        <td>
                          <div className="font-bold text-sm">{v.name}</div>
                          <div className="text-[11px] text-base-content/60">{v.email}</div>
                        </td>
                        <td>{v.phone || "No Phone"}</td>
                        <td>
                          {v.skills && v.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {v.skills.map((s, idx) => (
                                <span key={idx} className="badge badge-xs badge-ghost">
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="italic text-base-content/50">General Rescue</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge badge-sm font-semibold capitalize ${
                              status === "approved"
                                ? "badge-success text-white"
                                : status === "rejected"
                                ? "badge-error text-white"
                                : "badge-warning"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td>
                          <span className="font-bold">{v.assignedTasks?.length || 0}</span> task(s)
                        </td>
                        <td className="text-right space-x-1">
                          {status !== "approved" && (
                            <button
                              onClick={() => handleVolunteerStatusUpdate(v._id, "approved")}
                              className="btn btn-xs btn-success text-white font-bold"
                            >
                              Approve ✓
                            </button>
                          )}
                          {status !== "rejected" && (
                            <button
                              onClick={() => handleVolunteerStatusUpdate(v._id, "rejected")}
                              className="btn btn-xs btn-error text-white font-bold"
                            >
                              Reject ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

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
                    <th>Assigned Volunteer</th>
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
                          className="btn btn-xs btn-outline btn-primary font-bold"
                        >
                          Manage / Dispatch ⚙️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

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
                ⚙️ Dispatch & Manage Incident #{String(selectedRequest._id).slice(-6)}
              </h3>
              <button onClick={() => setStatusUpdateModalOpen(false)} className="btn btn-xs btn-circle btn-ghost">✕</button>
            </div>

            <div className="space-y-4 my-3">
              <div className="p-3 bg-base-200 rounded-lg text-xs space-y-1">
                <div><span className="font-semibold">Disaster:</span> <span className="capitalize">{selectedRequest.disasterType} ({selectedRequest.assistanceTypeRequired})</span></div>
                <div><span className="font-semibold">Affected:</span> {selectedRequest.numberOfAffectedIndividuals} people</div>
                <div><span className="font-semibold">Location:</span> {selectedRequest.location?.address || "Coordinates given"}</div>
                <div><span className="font-semibold">Priority:</span> <span className="uppercase font-bold text-error">{selectedRequest.priorityLevel}</span></div>
              </div>

              {/* Request Timeline View */}
              <RequestTimeline
                status={selectedRequest.status}
                history={selectedRequest.statusHistory}
                completionReport={selectedRequest.completionReport}
              />
            </div>

            <form onSubmit={handleSaveStatusUpdate} className="space-y-3">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Assign Approved Volunteer</span>
                </label>
                <select
                  value={selectedVolunteerId}
                  onChange={(e) => setSelectedVolunteerId(e.target.value)}
                  className="select select-bordered select-sm w-full text-xs"
                >
                  <option value="">-- Select Approved Volunteer --</option>
                  {approvedVolunteersList.map((vol) => (
                    <option key={vol._id} value={vol._id}>
                      🦺 {vol.name} ({vol.phone || vol.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Incident Workflow Status</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="select select-bordered select-sm w-full text-xs"
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
                  <span className="label-text text-xs font-semibold">Dispatch Note</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Volunteer squad dispatched with medical supplies."
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
                <button type="submit" className="btn btn-sm btn-primary font-bold">
                  Save Changes & Dispatch
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

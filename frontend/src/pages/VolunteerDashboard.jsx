import { useState, useEffect, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import WeatherCard from "../components/WeatherCard";
import RequestTimeline from "../components/RequestTimeline";

/**
 * Role-Based Volunteer Dashboard
 * Modules: Volunteer Management, Task Tracking & Weather Alerts (Israt Jahan Lamia)
 */
export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [activeModalRequest, setActiveModalRequest] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("in_progress");
  const [updateNote, setUpdateNote] = useState("");

  const fetchVolunteerData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch assigned tasks via dedicated endpoint
      let assigned = [];
      try {
        const myTasksRes = await axiosClient.get("/volunteers/my-tasks");
        assigned = myTasksRes.data.tasks || [];
      } catch (e) {
        // Fallback to general request list
        const res = await axiosClient.get("/requests");
        const all = Array.isArray(res.data) ? res.data : res.data.requests || [];
        assigned = all.filter(
          (r) => r.assignedVolunteer?._id === user?.id || r.assignedVolunteer === user?.id
        );
      }

      // Fetch pending unassigned calls
      const res = await axiosClient.get("/requests");
      const all = Array.isArray(res.data) ? res.data : res.data.requests || [];
      const unassigned = all.filter((r) => !r.assignedVolunteer && r.status === "pending");

      setAssignedRequests(assigned);
      setPendingRequests(unassigned);
    } catch (err) {
      console.error("Error loading volunteer hub:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVolunteerData();
  }, [fetchVolunteerData]);

  const handleUpdateIncident = async (e) => {
    e.preventDefault();
    if (!activeModalRequest) return;

    try {
      // Use new volunteer status update endpoint
      await axiosClient.put(`/volunteers/tasks/${activeModalRequest._id}/status`, {
        status: updateStatus,
        note: updateNote || `Progress updated to ${updateStatus}`,
        completionNotes: updateNote,
      });

      setActiveModalRequest(null);
      fetchVolunteerData();
    } catch (err) {
      // Fallback endpoint if needed
      try {
        await axiosClient.patch(`/requests/${activeModalRequest._id}/status`, {
          status: updateStatus,
          note: updateNote,
        });
        setActiveModalRequest(null);
        fetchVolunteerData();
      } catch (err2) {
        alert("Failed to update status: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleClaimRequest = async (requestId) => {
    try {
      await axiosClient.put("/volunteers/assign-task", {
        requestId,
        volunteerId: user?.id,
      });
      fetchVolunteerData();
    } catch (err) {
      try {
        await axiosClient.patch(`/requests/${requestId}/status`, {
          status: "assigned",
          note: `Volunteer ${user?.name || "Responder"} accepted rescue task`,
          assignedVolunteer: user?.id,
        });
        fetchVolunteerData();
      } catch (err2) {
        alert("Failed to accept task: " + (err.response?.data?.message || err.message));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm font-medium text-base-content/70">Loading Volunteer Mission Command...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Volunteer Header */}
      <div className="card bg-base-100 border border-base-300 shadow-sm p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-base-content">
              🦺 Volunteer Rescue Mission Board
            </h1>
            <span className="badge badge-warning text-black font-bold">Active Field Responder</span>
          </div>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Welcome back, <span className="font-semibold text-base-content">{user?.name}</span>. Receive weather alerts, dispatch calls, and track emergency rescue operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchVolunteerData} className="btn btn-sm btn-ghost gap-1">
            <span>🔄</span>
            <span>Refresh Board</span>
          </button>
        </div>
      </div>

      {/* Live Weather Alert Banner Widget */}
      <WeatherCard />

      {/* Volunteer Missions Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
          <span className="text-xs text-base-content/70 font-semibold uppercase">Assigned Missions</span>
          <div className="text-2xl font-black text-primary mt-1">{assignedRequests.length}</div>
          <span className="text-[11px] text-base-content/60">Active tasks requiring your rescue response</span>
        </div>

        <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
          <span className="text-xs text-base-content/70 font-semibold uppercase">Pending Calls</span>
          <div className="text-2xl font-black text-warning mt-1">{pendingRequests.length}</div>
          <span className="text-[11px] text-base-content/60">Unassigned emergencies ready to claim</span>
        </div>

        <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
          <span className="text-xs text-base-content/70 font-semibold uppercase">Responder Status</span>
          <div className="text-2xl font-black text-success mt-1">Ready</div>
          <span className="text-[11px] text-base-content/60">Dispatched to {user?.phone || "registered mobile"}</span>
        </div>
      </div>

      {/* Assigned Rescue Missions Section */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body p-4 sm:p-6">
          <h2 className="card-title text-base font-bold pb-2 border-b border-base-200">
            🎯 Your Assigned Rescue Tasks ({assignedRequests.length})
          </h2>

          {assignedRequests.length === 0 ? (
            <div className="text-center py-8 text-xs text-base-content/60">
              You do not have any active rescue assignments at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 mt-3">
              {assignedRequests.map((r) => (
                <div key={r._id} className="p-4 bg-base-200/60 rounded-xl border border-base-300 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                      <div className="font-bold text-base capitalize flex items-center gap-2">
                        <span>{r.disasterType === "flood" ? "🌊" : r.disasterType === "fire" ? "🔥" : "🚨"}</span>
                        <span>{r.disasterType} Emergency Incident</span>
                        <span className="badge badge-sm badge-outline uppercase">{r.assistanceTypeRequired}</span>
                      </div>
                      <p className="text-xs text-base-content/70 mt-1">
                        📍 <span className="font-semibold">{r.location?.address || "Coordinates recorded"}</span> • 👥 <span className="font-bold">{r.numberOfAffectedIndividuals}</span> affected people
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`badge badge-sm uppercase font-bold ${r.priorityLevel === "critical" ? "badge-error text-white animate-pulse" : "badge-warning"}`}>
                        {r.priorityLevel} priority
                      </span>
                      <button
                        onClick={() => {
                          setActiveModalRequest(r);
                          setUpdateStatus(r.status);
                          setUpdateNote("");
                        }}
                        className="btn btn-xs btn-primary font-bold shadow-sm"
                      >
                        Update Progress 📝
                      </button>
                    </div>
                  </div>

                  {/* Request Timeline */}
                  <RequestTimeline
                    status={r.status}
                    history={r.statusHistory}
                    completionReport={r.completionReport}
                  />

                  {r.reporter && (
                    <div className="text-xs text-base-content/80 pt-2 border-t border-base-300 flex flex-wrap justify-between">
                      <span>👤 Contact: <strong className="text-base-content">{r.reporter.name}</strong> ({r.reporter.phone || "N/A"})</span>
                      {r.description && <span className="italic text-base-content/70">"{r.description}"</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Pending Emergencies to Claim */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body p-4 sm:p-6">
          <h2 className="card-title text-base font-bold pb-2 border-b border-base-200">
            🆘 Available Emergencies to Claim ({pendingRequests.length})
          </h2>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-6 text-xs text-base-content/60">
              No pending unassigned emergency calls.
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              {pendingRequests.slice(0, 5).map((r) => (
                <div key={r._id} className="p-3 bg-base-200/40 rounded-xl border border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold capitalize text-sm flex items-center gap-2">
                      <span>{r.disasterType} Incident</span>
                      <span className={`badge badge-xs uppercase ${r.priorityLevel === "critical" ? "badge-error text-white" : "badge-warning"}`}>
                        {r.priorityLevel}
                      </span>
                    </div>
                    <p className="text-base-content/70 mt-0.5">
                      📍 {r.location?.address} • {r.numberOfAffectedIndividuals} victims • Needs {r.assistanceTypeRequired}
                    </p>
                  </div>
                  <button
                    onClick={() => handleClaimRequest(r._id)}
                    className="btn btn-xs btn-outline btn-success font-semibold"
                  >
                    Accept Rescue Mission 🦺
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Update Progress Modal */}
      {activeModalRequest && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-md">
            <div className="flex justify-between items-center pb-2 border-b border-base-200">
              <h3 className="font-bold text-sm">Update Task Progress & Completion Report</h3>
              <button onClick={() => setActiveModalRequest(null)} className="btn btn-xs btn-circle btn-ghost">✕</button>
            </div>

            <form onSubmit={handleUpdateIncident} className="space-y-3 mt-3">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Current Rescue Progress</span>
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="in_progress">Rescue Operations In Progress</option>
                  <option value="resolved">Mission Completed / Victims Safe</option>
                  <option value="assigned">En Route / Assigned</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Completion Report / Incident Notes</span>
                </label>
                <textarea
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="e.g. 5 victims safely evacuated and transferred to Central Shelter."
                  className="textarea textarea-bordered h-24 text-xs"
                  required
                />
              </div>

              <div className="modal-action">
                <button type="button" onClick={() => setActiveModalRequest(null)} className="btn btn-sm btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary font-bold">
                  Submit Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

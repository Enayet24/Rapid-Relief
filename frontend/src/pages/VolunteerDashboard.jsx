import { useState, useEffect, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

/**
 * Role-Based Volunteer Dashboard
 * Module 2 - Assigned to: Ariful Islam Bijoy (ID: 22101504)
 */
export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalRequest, setActiveModalRequest] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("in_progress");
  const [updateNote, setUpdateNote] = useState("");

  const fetchVolunteerData = useCallback(async () => {
    try {
      const res = await axiosClient.get("/requests");
      const all = Array.isArray(res.data) ? res.data : res.data.requests || [];

      // Filter requests assigned to this volunteer or pending
      const assigned = all.filter(
        (r) => r.assignedVolunteer?._id === user?.id || r.assignedVolunteer === user?.id
      );
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
      await axiosClient.patch(`/requests/${activeModalRequest._id}/status`, {
        status: updateStatus,
        note: updateNote || `Volunteer updated status to ${updateStatus}`,
      });
      setActiveModalRequest(null);
      fetchVolunteerData();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleClaimRequest = async (requestId) => {
    try {
      await axiosClient.patch(`/requests/${requestId}/status`, {
        status: "assigned",
        note: `Volunteer ${user?.name || "Responder"} accepted rescue task`,
        assignedVolunteer: user?.id,
      });
      fetchVolunteerData();
    } catch (err) {
      alert("Failed to accept task: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
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
            <span className="badge badge-warning text-black font-bold">Active Responder</span>
          </div>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Welcome back, <span className="font-semibold text-base-content">{user?.name}</span>. Receive SMS dispatch alerts and update field rescue missions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchVolunteerData} className="btn btn-sm btn-ghost">
            🔄 Refresh Board
          </button>
        </div>
      </div>

      {/* Volunteer Missions Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
          <span className="text-xs text-base-content/70 font-semibold uppercase">Assigned Missions</span>
          <div className="text-2xl font-black text-primary mt-1">{assignedRequests.length}</div>
          <span className="text-[11px] text-base-content/60">Active tasks requiring your response</span>
        </div>

        <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
          <span className="text-xs text-base-content/70 font-semibold uppercase">Pending Calls</span>
          <div className="text-2xl font-black text-warning mt-1">{pendingRequests.length}</div>
          <span className="text-[11px] text-base-content/60">Unassigned emergencies open to claim</span>
        </div>

        <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
          <span className="text-xs text-base-content/70 font-semibold uppercase">SMS Alerts</span>
          <div className="text-2xl font-black text-success mt-1">Active</div>
          <span className="text-[11px] text-base-content/60">Dispatched to {user?.phone || "your profile phone"}</span>
        </div>
      </div>

      {/* Assigned Missions Section */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {assignedRequests.map((r) => (
                <div key={r._id} className="p-4 bg-base-200/60 rounded-xl border border-base-300 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-sm capitalize flex items-center gap-1.5">
                        <span>{r.disasterType === "flood" ? "🌊" : r.disasterType === "fire" ? "🔥" : "🚨"}</span>
                        <span>{r.disasterType}</span>
                        <span className="badge badge-xs badge-outline uppercase">{r.assistanceTypeRequired}</span>
                      </div>
                      <span className={`badge badge-xs uppercase font-bold ${r.priorityLevel === "critical" ? "badge-error text-white animate-pulse" : "badge-warning"}`}>
                        {r.priorityLevel}
                      </span>
                    </div>

                    <div className="text-xs text-base-content/80 mt-2 space-y-1">
                      <p>📍 <span className="font-semibold">{r.location?.address || "Coordinates recorded"}</span></p>
                      <p>👥 <span className="font-semibold">{r.numberOfAffectedIndividuals}</span> affected individuals</p>
                      <p>👤 Contact: <span className="font-semibold">{r.reporter?.name}</span> ({r.reporter?.phone || "No phone"})</p>
                      {r.description && <p className="italic text-base-content/70">"{r.description}"</p>}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-base-300 flex items-center justify-between">
                    <span className="badge badge-sm font-semibold capitalize badge-primary">
                      Status: {r.status.replace("_", " ")}
                    </span>
                    <button
                      onClick={() => {
                        setActiveModalRequest(r);
                        setUpdateStatus(r.status);
                        setUpdateNote("");
                      }}
                      className="btn btn-xs btn-primary font-bold"
                    >
                      Update Progress 📝
                    </button>
                  </div>
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
                    Accept Mission 🦺
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
              <h3 className="font-bold text-sm">Update Task Progress</h3>
              <button onClick={() => setActiveModalRequest(null)} className="btn btn-xs btn-circle btn-ghost">✕</button>
            </div>

            <form onSubmit={handleUpdateIncident} className="space-y-3 mt-3">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Current Progress Status</span>
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="in_progress">Rescue In Progress</option>
                  <option value="resolved">Mission Successfully Resolved</option>
                  <option value="assigned">Assigned / En Route</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Field Report / Completion Note</span>
                </label>
                <textarea
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="e.g. 5 victims safely relocated to nearest shelter..."
                  className="textarea textarea-bordered h-20 text-xs"
                />
              </div>

              <div className="modal-action">
                <button type="button" onClick={() => setActiveModalRequest(null)} className="btn btn-sm btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
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

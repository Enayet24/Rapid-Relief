import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

/**
 * Role-Based Citizen Dashboard
 * Module 2 - Assigned to: Ariful Islam Bijoy (ID: 22101504)
 */
export default function CitizenDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosClient.get("/requests"),
      axiosClient.get("/shelters"),
    ])
      .then(([reqRes, shelterRes]) => {
        setRequests(Array.isArray(reqRes.data) ? reqRes.data : reqRes.data.requests || []);
        setShelters(shelterRes.data || []);
      })
      .catch((err) => console.error("Error loading citizen hub:", err))
      .finally(() => setLoading(false));
  }, []);

  const activeRequests = requests.filter((r) => r.status !== "resolved" && r.status !== "cancelled");
  const resolvedRequests = requests.filter((r) => r.status === "resolved");

  const getStepIndex = (status) => {
    switch (status) {
      case "pending": return 1;
      case "assigned": return 2;
      case "in_progress": return 3;
      case "resolved": return 4;
      default: return 1;
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
      {/* Emergency Assistance Callout Banner */}
      <div className="card bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg rounded-2xl overflow-hidden">
        <div className="card-body p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="badge badge-warning text-black font-bold mb-2">🚨 EMERGENCY HOTLINE ACTIVE</div>
            <h1 className="text-2xl sm:text-3xl font-black">Need Urgent Relief Assistance?</h1>
            <p className="text-sm text-red-100 mt-1 max-w-xl">
              Report immediate flood, cyclone, fire, or earthquake hazards. Our disaster dispatchers and nearest volunteer rescue teams will be alerted automatically.
            </p>
          </div>
          <Link
            to="/requests/new"
            className="btn btn-warning text-black font-extrabold text-sm sm:text-base px-6 shadow-md hover:scale-105 transition-transform"
          >
            🆘 Report Emergency Now
          </Link>
        </div>
      </div>

      {/* Citizen Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
          <div className="text-xs text-base-content/70 font-semibold uppercase">Active Requests</div>
          <div className="text-2xl font-black text-warning mt-1">{activeRequests.length}</div>
          <div className="text-[11px] text-base-content/60">Being monitored by rescue teams</div>
        </div>

        <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
          <div className="text-xs text-base-content/70 font-semibold uppercase">Resolved Requests</div>
          <div className="text-2xl font-black text-success mt-1">{resolvedRequests.length}</div>
          <div className="text-[11px] text-base-content/60">Successfully assisted</div>
        </div>

        <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
          <div className="text-xs text-base-content/70 font-semibold uppercase">Available Shelters</div>
          <div className="text-2xl font-black text-primary mt-1">
            {shelters.filter((s) => s.status === "open").length}
          </div>
          <div className="text-[11px] text-base-content/60">Open in your region</div>
        </div>
      </div>

      {/* Live Request Status Tracking */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body p-4 sm:p-6">
          <div className="flex justify-between items-center pb-3 border-b border-base-200">
            <div>
              <h2 className="card-title text-base font-bold">📋 Live Emergency Status Tracker</h2>
              <p className="text-xs text-base-content/70">Real-time status updates for your submitted incidents</p>
            </div>
            <Link to="/requests" className="btn btn-xs btn-ghost">View All</Link>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-8 text-xs text-base-content/60">
              You have not submitted any emergency requests yet.
            </div>
          ) : (
            <div className="space-y-4 mt-3">
              {requests.slice(0, 3).map((r) => {
                const currentStep = getStepIndex(r.status);
                return (
                  <div key={r._id} className="p-4 bg-base-200/50 rounded-xl border border-base-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <div className="font-bold text-sm capitalize flex items-center gap-1.5">
                          <span>{r.disasterType === "flood" ? "🌊" : r.disasterType === "fire" ? "🔥" : "🚨"}</span>
                          <span>{r.disasterType} Incident</span>
                          <span className="badge badge-xs badge-outline uppercase ml-1">{r.assistanceTypeRequired}</span>
                        </div>
                        <p className="text-xs text-base-content/70">
                          📍 {r.location?.address || "Coordinates recorded"} • {r.numberOfAffectedIndividuals} people affected
                        </p>
                      </div>
                      <span className="badge badge-sm font-semibold capitalize badge-primary">
                        {r.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Step Progress Bar */}
                    <ul className="steps steps-horizontal w-full text-[11px] my-2">
                      <li className={`step ${currentStep >= 1 ? "step-primary font-semibold" : ""}`}>
                        Submitted
                      </li>
                      <li className={`step ${currentStep >= 2 ? "step-primary font-semibold" : ""}`}>
                        Assigned
                      </li>
                      <li className={`step ${currentStep >= 3 ? "step-primary font-semibold" : ""}`}>
                        In Progress
                      </li>
                      <li className={`step ${currentStep >= 4 ? "step-primary font-semibold" : ""}`}>
                        Resolved
                      </li>
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Nearby Shelters Quick Lookup */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body p-4 sm:p-6">
          <div className="flex justify-between items-center pb-3 border-b border-base-200">
            <h2 className="card-title text-base font-bold">🏠 Available Emergency Shelters</h2>
            <Link to="/shelters" className="btn btn-xs btn-outline btn-primary">Browse All</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {shelters.slice(0, 3).map((s) => (
              <div key={s._id} className="p-3 bg-base-200/50 rounded-xl border border-base-200 text-xs">
                <div className="font-bold text-sm text-base-content">{s.name}</div>
                <div className="text-base-content/70 mt-0.5">📍 {s.location?.address}</div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-base-300">
                  <span className={`badge badge-xs ${s.status === "open" ? "badge-success text-white" : "badge-error"}`}>
                    {s.status}
                  </span>
                  <span className="font-semibold text-base-content/80">
                    {s.currentOccupancy} / {s.capacity} spots
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

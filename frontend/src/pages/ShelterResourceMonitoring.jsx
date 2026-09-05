import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import StatCard from "../components/StatCard";

/**
 * Shelter & Resource Monitoring — Module 2
 * Assigned to: Iffat Islam Aria
 *
 * This is a dedicated "at risk" view, distinct from the Admin Dashboard's
 * aggregate summary: it surfaces exactly which shelters are nearing capacity
 * and which inventory items are low on stock, so an admin can act on them
 * directly instead of reading a chart. The underlying alerts (Notification
 * records) already fire from shelterController.js / resourceController.js
 * whenever a shelter crosses the near-capacity threshold or a resource
 * crosses its low-stock threshold — this page is the live, always-current
 * view of that same condition.
 */

const NEAR_CAPACITY_RATIO = 0.9; // keep in sync with backend/controllers/shelterController.js

export default function ShelterResourceMonitoring() {
  const [shelters, setShelters] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([axiosClient.get("/shelters"), axiosClient.get("/resources")])
      .then(([sheltersRes, resourcesRes]) => {
        setShelters(sheltersRes.data);
        setResources(resourcesRes.data);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load monitoring data"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const atRiskShelters = useMemo(() => {
    return shelters
      .filter((s) => s.capacity > 0 && s.currentOccupancy / s.capacity >= NEAR_CAPACITY_RATIO)
      .sort((a, b) => b.currentOccupancy / b.capacity - a.currentOccupancy / a.capacity);
  }, [shelters]);

  const lowStockResources = useMemo(() => {
    return resources
      .filter((r) => r.quantity <= (r.lowStockThreshold || 10))
      .sort((a, b) => a.quantity - b.quantity);
  }, [resources]);

  const totalOccupancy = shelters.reduce((sum, s) => sum + (s.currentOccupancy || 0), 0);
  const totalCapacity = shelters.reduce((sum, s) => sum + (s.capacity || 0), 0);
  const overallOccupancyPct = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-base-content flex items-center gap-2">
            <span>🔎 Shelter &amp; Resource Monitoring</span>
          </h1>
          <p className="text-xs text-base-content/70">
            Live view of shelters nearing capacity and inventory running low — the same conditions that trigger admin alerts.
          </p>
        </div>
        <button onClick={load} className="btn btn-sm btn-ghost">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-error text-xs py-2">{error}</div>}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          title="Overall Occupancy"
          value={`${overallOccupancyPct}%`}
          subtext={`${totalOccupancy} / ${totalCapacity} spots filled`}
          icon="🏠"
          variant={overallOccupancyPct >= 90 ? "error" : overallOccupancyPct >= 75 ? "warning" : "success"}
        />
        <StatCard
          title="Shelters At Risk"
          value={atRiskShelters.length}
          subtext="≥ 90% occupied or full"
          icon="⚠️"
          variant={atRiskShelters.length > 0 ? "error" : "success"}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockResources.length}
          subtext="At or below threshold"
          icon="📦"
          variant={lowStockResources.length > 0 ? "warning" : "success"}
        />
      </div>

      {/* Shelters Nearing Capacity */}
      <div className="card bg-base-100 border border-base-200">
        <div className="card-body p-4 sm:p-5">
          <h2 className="font-bold text-sm uppercase tracking-wider text-base-content/80 mb-3 flex items-center gap-2">
            <span>⚠️ Shelters Nearing Capacity</span>
            <span className="badge badge-sm badge-ghost">{atRiskShelters.length}</span>
          </h2>

          {atRiskShelters.length === 0 ? (
            <p className="text-xs text-base-content/60 py-4 text-center">
              No shelters are currently near capacity. ✅
            </p>
          ) : (
            <div className="space-y-2">
              {atRiskShelters.map((s) => {
                const pct = Math.round((s.currentOccupancy / s.capacity) * 100);
                return (
                  <div key={s._id} className="flex items-center gap-3 p-2.5 rounded-lg bg-base-200/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="truncate">{s.name}</span>
                        <span className={pct >= 100 ? "text-error font-bold" : "text-warning font-bold"}>
                          {s.currentOccupancy} / {s.capacity} ({pct}%)
                        </span>
                      </div>
                      <progress
                        className={`progress w-full h-1.5 mt-1 ${pct >= 100 ? "progress-error" : "progress-warning"}`}
                        value={s.currentOccupancy}
                        max={s.capacity || 1}
                      />
                    </div>
                    <span className={`badge badge-xs uppercase ${pct >= 100 ? "badge-error text-white" : "badge-warning text-black"}`}>
                      {s.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-base-200">
            <Link to="/shelters" className="link link-primary text-xs font-semibold">
              View all shelters →
            </Link>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="card bg-base-100 border border-base-200">
        <div className="card-body p-4 sm:p-5">
          <h2 className="font-bold text-sm uppercase tracking-wider text-base-content/80 mb-3 flex items-center gap-2">
            <span>📦 Low Stock Alerts</span>
            <span className="badge badge-sm badge-ghost">{lowStockResources.length}</span>
          </h2>

          {lowStockResources.length === 0 ? (
            <p className="text-xs text-base-content/60 py-4 text-center">
              No inventory items are currently low on stock. ✅
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm table-zebra w-full">
                <thead>
                  <tr className="text-xs text-base-content/80">
                    <th>Item</th>
                    <th>Category</th>
                    <th>Remaining</th>
                    <th>Threshold</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockResources.map((r) => (
                    <tr key={r._id} className="hover text-xs">
                      <td className="font-bold">{r.name}</td>
                      <td className="capitalize text-primary font-semibold">{r.category}</td>
                      <td>
                        <span className="text-error font-black">{r.quantity}</span> {r.unit}
                      </td>
                      <td className="text-base-content/70">{r.lowStockThreshold || 10}</td>
                      <td className="text-base-content/70">{r.shelter?.name || "Central Relief Warehouse"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-base-200">
            <Link to="/resources" className="link link-primary text-xs font-semibold">
              Manage inventory →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

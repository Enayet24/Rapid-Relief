import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

const PRIORITY_BADGE = {
  critical: "badge-error",
  high: "badge-warning",
  medium: "badge-info",
  low: "badge-ghost",
};

export default function RequestList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axiosClient
      .get("/requests")
      .then((res) => setRequests(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load requests"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <span className="loading loading-spinner loading-lg" />;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Disaster</th>
            <th>Assistance</th>
            <th>Affected</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r._id}>
              <td className="capitalize">{r.disasterType}</td>
              <td className="capitalize">{r.assistanceTypeRequired}</td>
              <td>{r.numberOfAffectedIndividuals}</td>
              <td>
                <span className={`badge ${PRIORITY_BADGE[r.priorityLevel] || "badge-ghost"}`}>
                  {r.priorityLevel}
                </span>
              </td>
              <td className="capitalize">{r.status.replace("_", " ")}</td>
              <td>{new Date(r.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-6 opacity-60">
                No requests yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

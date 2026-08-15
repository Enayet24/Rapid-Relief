import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

const STATUS_BADGE = {
  open: "badge-success",
  full: "badge-warning",
  closed: "badge-error",
};

export default function ShelterList() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axiosClient
      .get("/shelters")
      .then((res) => setShelters(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load shelters"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <span className="loading loading-spinner loading-lg" />;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {shelters.map((s) => (
        <div key={s._id} className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <h2 className="card-title">{s.name}</h2>
              <span className={`badge ${STATUS_BADGE[s.status] || "badge-ghost"}`}>{s.status}</span>
            </div>
            <p className="text-sm opacity-70">{s.location?.address}</p>
            <progress
              className="progress progress-primary w-full"
              value={s.currentOccupancy}
              max={s.capacity}
            />
            <p className="text-sm">
              {s.currentOccupancy} / {s.capacity} occupied
            </p>
            {s.facilities?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {s.facilities.map((f) => (
                  <span key={f} className="badge badge-outline badge-sm">{f}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      {shelters.length === 0 && <p className="opacity-60">No shelters registered yet.</p>}
    </div>
  );
}
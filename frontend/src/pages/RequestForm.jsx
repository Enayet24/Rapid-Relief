import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

const DISASTER_TYPES = [
  { id: "flood", label: "Flood", icon: "🌊", desc: "Rising water, flash floods, submerged areas" },
  { id: "cyclone", label: "Cyclone", icon: "🌀", desc: "Severe storms, coastal tidal surges" },
  { id: "fire", label: "Fire Incident", icon: "🔥", desc: "Building fire, electrical fire, chemical hazard" },
  { id: "earthquake", label: "Earthquake", icon: "🏚️", desc: "Building collapse, debris entrapment" },
  { id: "landslide", label: "Landslide", icon: "⛰️", desc: "Hill slope collapse, blocked roads" },
  { id: "other", label: "Other Hazard", icon: "⚠️", desc: "Severe environmental or civil emergency" },
];

const ASSISTANCE_TYPES = [
  { id: "rescue", label: "Rescue & Evacuation", icon: "🛟", color: "border-red-500 bg-red-500/10 text-red-600" },
  { id: "medical", label: "Medical Aid & Trauma", icon: "🏥", color: "border-emerald-500 bg-emerald-500/10 text-emerald-600" },
  { id: "food", label: "Food & Dry Rations", icon: "🍲", color: "border-amber-500 bg-amber-500/10 text-amber-600" },
  { id: "water", label: "Clean Drinking Water", icon: "💧", color: "border-blue-500 bg-blue-500/10 text-blue-600" },
  { id: "shelter", label: "Emergency Shelter", icon: "⛺", color: "border-purple-500 bg-purple-500/10 text-purple-600" },
  { id: "other", label: "Other Relief Support", icon: "📦", color: "border-slate-500 bg-slate-500/10 text-slate-600" },
];

export default function RequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    disasterType: "flood",
    assistanceTypeRequired: "rescue",
    numberOfAffectedIndividuals: 4,
    description: "",
    address: "",
    lat: "23.8103",
    lng: "90.4125",
  });

  const [status, setStatus] = useState(null); // null | 'submitting' | 'success' | error_message
  const [createdRequestId, setCreatedRequestId] = useState(null);
  const [locating, setLocating] = useState(false);

  // Auto-detect GPS coordinates
  const handleDetectLocation = () => {
    if ("geolocation" in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm((prev) => ({
            ...prev,
            lat: position.coords.latitude.toFixed(4),
            lng: position.coords.longitude.toFixed(4),
            address: prev.address || `GPS Coordinates: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          }));
          setLocating(false);
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
          setLocating(false);
          alert("Could not automatically retrieve GPS coordinates. Please enter location manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      const payload = {
        disasterType: form.disasterType,
        assistanceTypeRequired: form.assistanceTypeRequired,
        numberOfAffectedIndividuals: Number(form.numberOfAffectedIndividuals) || 1,
        description: form.description,
        location: {
          type: "Point",
          coordinates: [Number(form.lng) || 90.4125, Number(form.lat) || 23.8103],
          address: form.address || "Reported disaster location",
        },
      };
      const res = await axiosClient.post("/requests", payload);
      setCreatedRequestId(res.data._id);
      setStatus("success");
    } catch (err) {
      setStatus(err.response?.data?.message || "Failed to submit emergency request. Please try again.");
    }
  };

  // Estimated Priority calculation for live feedback
  const getEstimatedPriority = () => {
    const victims = Number(form.numberOfAffectedIndividuals) || 1;
    if (form.assistanceTypeRequired === "rescue" || form.assistanceTypeRequired === "medical" || victims >= 15) {
      return { level: "CRITICAL", color: "bg-error text-white animate-pulse" };
    }
    if (victims >= 5 || form.disasterType === "fire" || form.disasterType === "flood") {
      return { level: "HIGH", color: "bg-warning text-black" };
    }
    return { level: "MEDIUM", color: "bg-info text-white" };
  };

  const estimatedPriority = getEstimatedPriority();

  // Success view
  if (status === "success") {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="card bg-base-100 shadow-xl border border-success/30 rounded-2xl overflow-hidden text-center p-6 sm:p-8">
          <div className="w-16 h-16 bg-success/15 text-success rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
            ✓
          </div>
          <h2 className="text-2xl font-black text-base-content">
            Emergency Request Dispatched!
          </h2>
          <p className="text-xs text-base-content/70 mt-2">
            Your emergency report has been registered in the system with{" "}
            <span className="font-bold text-error">Priority: {estimatedPriority.level}</span>.
          </p>

          <div className="p-4 bg-base-200/70 rounded-xl my-5 text-left text-xs space-y-2 border border-base-300">
            <div className="flex justify-between">
              <span className="text-base-content/60">Disaster Category:</span>
              <span className="font-bold capitalize">{form.disasterType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/60">Assistance Needed:</span>
              <span className="font-bold capitalize">{form.assistanceTypeRequired}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/60">People Affected:</span>
              <span className="font-bold">{form.numberOfAffectedIndividuals} victims</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/60">Location:</span>
              <span className="font-bold truncate max-w-[200px]">{form.address || "GPS Coordinates"}</span>
            </div>
            {user?.phone && (
              <div className="pt-2 border-t border-base-300 flex items-center gap-1.5 text-success font-semibold">
                <span>📱</span>
                <span>SMS Alert sent to {user.phone}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link to="/citizen" className="btn btn-sm btn-primary">
              📋 Go to My Dashboard
            </Link>
            <Link to="/requests" className="btn btn-sm btn-outline">
              View All Requests
            </Link>
            <button
              onClick={() => {
                setStatus(null);
                setForm({
                  disasterType: "flood",
                  assistanceTypeRequired: "rescue",
                  numberOfAffectedIndividuals: 1,
                  description: "",
                  address: "",
                  lat: "23.8103",
                  lng: "90.4125",
                });
              }}
              className="btn btn-sm btn-ghost"
            >
              Report Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-700 text-white p-6 sm:p-8 shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-red-300 animate-ping" />
              <span>LIVE DISASTER RESPONSE HOTLINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Report an Emergency Incident
            </h1>
            <p className="text-xs sm:text-sm text-red-100 mt-1 max-w-lg">
              Submit critical rescue requirements, medical needs, or shelter requests. Nearest response teams and disaster dispatchers will be notified immediately.
            </p>
          </div>

          {/* Live Estimated Priority Card */}
          <div className="bg-black/30 backdrop-blur-md p-3.5 rounded-xl border border-white/20 text-center shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-white/80 block font-semibold">
              Auto Severity Rating
            </span>
            <div className={`badge badge-sm font-black mt-1 ${estimatedPriority.color}`}>
              {estimatedPriority.level} PRIORITY
            </div>
            <span className="text-[10px] text-white/70 block mt-1">
              {form.numberOfAffectedIndividuals} people affected
            </span>
          </div>
        </div>
      </div>

      {status && status !== "submitting" && (
        <div className="alert alert-error text-xs shadow-sm">
          <span>{status}</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="card bg-base-100 shadow-sm border border-base-300 rounded-2xl overflow-hidden">
        <form onSubmit={handleSubmit} className="card-body p-5 sm:p-7 space-y-6">
          {/* Step 1: Disaster Category Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-base-content/80 flex items-center gap-2">
              <span>1️⃣ Select Disaster Type</span>
              <span className="badge badge-xs badge-ghost">Required</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {DISASTER_TYPES.map((d) => {
                const isSelected = form.disasterType === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setForm({ ...form, disasterType: d.id })}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30"
                        : "border-base-200 bg-base-200/40 hover:bg-base-200"
                    }`}
                  >
                    <div className="text-2xl mb-1">{d.icon}</div>
                    <div>
                      <div className={`font-bold text-xs ${isSelected ? "text-primary" : "text-base-content"}`}>
                        {d.label}
                      </div>
                      <div className="text-[10px] text-base-content/60 line-clamp-1 mt-0.5">
                        {d.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Assistance Type Needed */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-base-content/80 flex items-center gap-2">
              <span>2️⃣ Assistance Required</span>
              <span className="badge badge-xs badge-ghost">Required</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ASSISTANCE_TYPES.map((a) => {
                const isSelected = form.assistanceTypeRequired === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setForm({ ...form, assistanceTypeRequired: a.id })}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? "border-primary bg-primary/15 font-bold ring-2 ring-primary/30"
                        : "border-base-200 bg-base-200/40 hover:bg-base-200"
                    }`}
                  >
                    <span className="text-xl">{a.icon}</span>
                    <span className="text-xs">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Victims Count & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/80">
                  👥 Affected People
                </span>
              </label>
              <div className="join w-full">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      numberOfAffectedIndividuals: Math.max(1, (Number(form.numberOfAffectedIndividuals) || 1) - 1),
                    })
                  }
                  className="join-item btn btn-sm btn-outline border-base-300"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={form.numberOfAffectedIndividuals}
                  onChange={(e) => setForm({ ...form, numberOfAffectedIndividuals: e.target.value })}
                  className="join-item input input-sm input-bordered w-full text-center font-bold text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      numberOfAffectedIndividuals: (Number(form.numberOfAffectedIndividuals) || 0) + 1,
                    })
                  }
                  className="join-item btn btn-sm btn-outline border-base-300"
                >
                  +
                </button>
              </div>
            </div>

            <div className="form-control sm:col-span-2">
              <label className="label py-1">
                <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/80">
                  📝 Situation Details
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. 2 infants and elderly trapped on tin roof, medical kits needed"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input input-sm input-bordered w-full text-xs"
              />
            </div>
          </div>

          {/* Step 4: Location & GPS */}
          <div className="p-4 bg-base-200/50 rounded-xl border border-base-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-base-content/80 flex items-center gap-1.5">
                <span>📍 Incident Location & GPS Coordinates</span>
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locating}
                className="btn btn-xs btn-outline btn-primary gap-1"
              >
                <span>{locating ? "⏳" : "🎯"}</span>
                <span>{locating ? "Detecting GPS..." : "Use My Current GPS"}</span>
              </button>
            </div>

            <div className="form-control">
              <input
                type="text"
                placeholder="Village / Road / Landmark / District (e.g. Village: Daganbhuiyan, Feni)"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input input-sm input-bordered w-full text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-[11px] text-base-content/60">Latitude</span></label>
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                  placeholder="23.8103"
                  className="input input-xs input-bordered font-mono text-xs"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-[11px] text-base-content/60">Longitude</span></label>
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                  placeholder="90.4125"
                  className="input input-xs input-bordered font-mono text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Notice Banner */}
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-900 dark:text-amber-200">
            <span className="text-lg">ℹ️</span>
            <span>
              By submitting, your emergency incident will be dispatched immediately to local rescue coordinators and an automated SMS confirmation will be sent.
            </span>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="btn btn-error text-white w-full font-black text-sm sm:text-base shadow-md hover:shadow-lg transition-all h-12"
            >
              {status === "submitting" ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "🚨 Submit Emergency Assistance Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

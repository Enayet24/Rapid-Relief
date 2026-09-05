import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

const DHAKA_CENTER = [23.8103, 90.4125]; // Leaflet uses [lat, lng]

const PRIORITY_COLOR = {
  critical: "#dc2626",
  high: "#f97316",
  medium: "#3b82f6",
  low: "#9ca3af",
};

const dotIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 3px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const shelterIcon = L.divIcon({
  className: "",
  html: `<div style="font-size:20px;line-height:20px;">🏠</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Leaflet's <MapContainer> only reads `center` on first mount — this small helper
// recenters the map imperatively whenever `center` changes (e.g. once geolocation resolves).
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function EmergencyMap() {
  const { user } = useAuth();
  const [center, setCenter] = useState(DHAKA_CENTER);
  const [requests, setRequests] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const [reqRes, shelterRes] = await Promise.all([
        axiosClient.get("/maps/emergency-locations"),
        axiosClient.get("/maps/nearby-shelters", { params: { lat, lng, radius: 25 } }),
      ]);
      setRequests(reqRes.data);
      setShelters(shelterRes.data);
    } catch (err) {
      console.error("Failed to load map data:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          setCenter(loc);
          loadData(loc[0], loc[1]);
        },
        () => loadData(DHAKA_CENTER[0], DHAKA_CENTER[1])
      );
    } else {
      loadData(DHAKA_CENTER[0], DHAKA_CENTER[1]);
    }
  }, [loadData]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">🗺️ Live Emergency Map</h1>
          <p className="text-xs text-base-content/70">
            Active emergency locations and nearby shelters, plotted in real time.
          </p>
        </div>
        <div className="flex gap-3 text-xs flex-wrap">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#dc2626] inline-block"></span> Critical</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#f97316] inline-block"></span> High</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#3b82f6] inline-block"></span> Medium</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#9ca3af] inline-block"></span> Low</span>
          <span className="flex items-center gap-1">🏠 Shelter</span>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200 p-3 relative">
        {loading && (
          <div className="absolute inset-0 bg-base-100/60 flex items-center justify-center z-[1000] rounded-2xl">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        )}
        <MapContainer center={center} zoom={12} style={{ width: "100%", height: "70vh", borderRadius: "1rem" }}>
          <RecenterMap center={center} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {requests.map((r) => (
            <Marker
              key={r._id}
              position={[r.location.coordinates[1], r.location.coordinates[0]]}
              icon={dotIcon(PRIORITY_COLOR[r.priorityLevel] || "#9ca3af")}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold capitalize">{r.disasterType} — {r.priorityLevel}</p>
                  <p>{r.numberOfAffectedIndividuals} people affected</p>
                  <p className="capitalize">Needs: {r.assistanceTypeRequired}</p>
                  <p className="capitalize text-gray-500">Status: {r.status.replace("_", " ")}</p>
                  {(user?.role === "volunteer" || user?.role === "admin") && (
                    <Link to={`/requests/${r._id}/navigate`} className="btn btn-xs btn-primary mt-1 w-full">
                      Navigate here
                    </Link>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {shelters.map((s) => (
            <Marker
              key={s._id}
              position={[s.location.coordinates[1], s.location.coordinates[0]]}
              icon={shelterIcon}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold">{s.name}</p>
                  <p>{s.currentOccupancy}/{s.capacity} occupied</p>
                  <p className="capitalize">Status: {s.status}</p>
                  <p>{s.distanceKm} km away</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
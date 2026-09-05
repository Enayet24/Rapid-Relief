import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import axiosClient from "../api/axiosClient";

const DHAKA_CENTER = [23.8103, 90.4125];
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

const youIcon = L.divIcon({
  className: "",
  html: `<div style="background:#2563eb;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 3px rgba(0,0,0,0.5);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const destIcon = L.divIcon({
  className: "",
  html: `<div style="font-size:22px;">📍</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) map.fitBounds(positions, { padding: [40, 40] });
  }, [positions, map]);
  return null;
}

export default function RequestNavigation() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]); // array of [lat, lng]
  const [routeInfo, setRouteInfo] = useState(null); // { distanceKm, minutes }
  const [error, setError] = useState(null);
  const requestedRoute = useRef(false);

  useEffect(() => {
    axiosClient
      .get(`/requests/${id}`)
      .then((res) => setRequest(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load request"));
  }, [id]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setOrigin(DHAKA_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin([pos.coords.latitude, pos.coords.longitude]),
      () => {
        setLocationDenied(true);
        setOrigin(DHAKA_CENTER);
      }
    );
  }, []);

  useEffect(() => {
    if (!origin || !request || requestedRoute.current) return;
    requestedRoute.current = true;

    const destLng = request.location.coordinates[0];
    const destLat = request.location.coordinates[1];

    const url = `https://api.openrouteservice.org/v2/directions/driving-car?start=${origin[1]},${origin[0]}&end=${destLng},${destLat}`;

    fetch(url, { headers: { Authorization: ORS_API_KEY } })
      .then((res) => res.json())
      .then((data) => {
        if (!data.features || !data.features[0]) {
          setError("Could not calculate a route to this location.");
          return;
        }
        const coords = data.features[0].geometry.coordinates; // [ [lng,lat], ... ]
        setRouteCoords(coords.map(([lng, lat]) => [lat, lng]));

        const summary = data.features[0].properties.summary;
        setRouteInfo({
          distanceKm: (summary.distance / 1000).toFixed(1),
          minutes: Math.round(summary.duration / 60),
        });
      })
      .catch(() => setError("Could not calculate a route to this location."));
  }, [origin, request]);

  if (error) return <div className="alert alert-error text-sm">{error}</div>;
  if (!request || !origin) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  const destination = [request.location.coordinates[1], request.location.coordinates[0]];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">🧭 Navigate to Rescue Location</h1>
          <p className="text-xs text-base-content/70 capitalize">
            {request.disasterType} — {request.priorityLevel} priority — {request.numberOfAffectedIndividuals} people affected
          </p>
        </div>
        <Link to="/requests" className="btn btn-sm btn-ghost">← Back to Requests</Link>
      </div>

      {locationDenied && (
        <div className="alert alert-warning text-xs py-2">
          Couldn't access your live location — showing a route from a default starting point instead.
        </div>
      )}

      {routeInfo && (
        <div className="stats shadow w-full bg-base-100 border border-base-200">
          <div className="stat py-3">
            <div className="stat-title text-xs">Distance</div>
            <div className="stat-value text-lg text-primary">{routeInfo.distanceKm} km</div>
          </div>
          <div className="stat py-3">
            <div className="stat-title text-xs">Estimated Time</div>
            <div className="stat-value text-lg text-primary">{routeInfo.minutes} min</div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 border border-base-200 p-3">
        <MapContainer center={origin} zoom={13} style={{ width: "100%", height: "65vh", borderRadius: "1rem" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={origin} icon={youIcon} />
          <Marker position={destination} icon={destIcon} />
          {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: "#2563eb", weight: 5 }} />}
          {routeCoords.length > 0 && <FitBounds positions={routeCoords} />}
        </MapContainer>
      </div>
    </div>
  );
}
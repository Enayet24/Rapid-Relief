import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";

/**
 * Compact Weather Alert Widget
 * Module: Weather API Integration (Israt Jahan Lamia)
 * Displays live weather conditions & disaster alerts
 */
export default function WeatherCard({ lat, lon }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get("/volunteers/weather", {
        params: { lat, lon },
      });
      setWeather(res.data);
    } catch (err) {
      console.error("Failed to load weather:", err);
      setError("Weather service unavailable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [lat, lon]);

  if (loading) {
    return (
      <div className="card bg-base-100 border border-base-200 shadow-sm p-4 flex items-center justify-center min-h-[100px]">
        <span className="loading loading-spinner loading-md text-primary"></span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="card bg-base-100 border border-base-200 shadow-sm p-4 text-xs text-base-content/60 flex items-center justify-between">
        <span>🌤 Weather Monitoring Station</span>
        <button onClick={fetchWeather} className="btn btn-xs btn-ghost">
          Retry 🔄
        </button>
      </div>
    );
  }

  return (
    <div className="card bg-gradient-to-r from-blue-900/10 via-base-100 to-indigo-900/10 border border-base-300 shadow-sm p-4 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Weather Main Info */}
        <div className="flex items-center gap-3">
          <div className="text-4xl p-2 rounded-2xl bg-base-200/80 shadow-inner">
            {weather.condition?.toLowerCase().includes("rain")
              ? "🌧️"
              : weather.condition?.toLowerCase().includes("storm")
              ? "🌩️"
              : weather.condition?.toLowerCase().includes("clear")
              ? "☀️"
              : "⛅"}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-base-content">
                📍 {weather.location}
              </h3>
              <span className="badge badge-xs badge-info font-bold text-white">
                {weather.temperature}°C
              </span>
            </div>
            <p className="text-xs text-base-content/80 font-medium capitalize mt-0.5">
              {weather.description}
            </p>
            <div className="flex gap-3 text-[11px] text-base-content/60 mt-1">
              <span>💧 Humidity: {weather.humidity}%</span>
              <span>💨 Wind: {weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>

        {/* Weather Alert Banner */}
        <div className="flex flex-col items-end justify-between">
          <span className="badge badge-error text-white font-bold text-xs p-2.5 shadow-sm animate-pulse">
            {weather.alert}
          </span>
          <button
            onClick={fetchWeather}
            className="text-[11px] text-primary font-semibold hover:underline mt-2 flex items-center gap-1"
          >
            <span>🔄 Update Live Weather</span>
          </button>
        </div>
      </div>
    </div>
  );
}

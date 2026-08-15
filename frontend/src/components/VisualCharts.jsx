/**
 * Visual Charts & Analytics Data Visualizers
 * Module 1 & 2 - Assigned to: Ariful Islam Bijoy (ID: 22101504)
 */

export function DisasterBreakdownChart({ data = [] }) {
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0) || 1;

  const disasterColors = {
    flood: "bg-blue-500",
    cyclone: "bg-indigo-600",
    earthquake: "bg-amber-600",
    fire: "bg-red-500",
    landslide: "bg-emerald-600",
    other: "bg-purple-500",
  };

  const disasterIcons = {
    flood: "🌊",
    cyclone: "🌀",
    earthquake: "🏚️",
    fire: "🔥",
    landslide: "⛰️",
    other: "⚠️",
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-4 sm:p-5">
        <h3 className="card-title text-sm font-bold flex items-center justify-between">
          <span>🌪️ Disaster Incidents Distribution</span>
          <span className="text-xs font-normal badge badge-ghost">{total} Total</span>
        </h3>

        {data.length === 0 ? (
          <div className="text-center py-6 text-xs text-base-content/60">
            No incident data recorded yet.
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {data.map((item) => {
              const count = item.count || 0;
              const percentage = Math.round((count / total) * 100);
              const color = disasterColors[item.type] || "bg-primary";
              const icon = disasterIcons[item.type] || "📍";

              return (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="capitalize flex items-center gap-1.5">
                      <span>{icon}</span>
                      <span>{item.type}</span>
                    </span>
                    <span className="text-base-content/80 font-bold">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-base-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function PriorityDistributionMeter({ data = [] }) {
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0) || 1;

  const priorityMeta = {
    critical: { label: "Critical", color: "bg-error", text: "text-error" },
    high: { label: "High", color: "bg-warning", text: "text-warning" },
    medium: { label: "Medium", color: "bg-info", text: "text-info" },
    low: { label: "Low", color: "bg-slate-400", text: "text-slate-500" },
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-4 sm:p-5">
        <h3 className="card-title text-sm font-bold flex items-center justify-between">
          <span>⚡ Priority Level Breakdown</span>
          <span className="text-xs font-normal badge badge-ghost">{total} Total</span>
        </h3>

        {/* Multi-segment visual bar */}
        <div className="w-full h-4 bg-base-200 rounded-full flex overflow-hidden my-3 shadow-inner">
          {data.map((item) => {
            const count = item.count || 0;
            const pct = (count / total) * 100;
            if (pct <= 0) return null;
            const meta = priorityMeta[item.level] || { color: "bg-primary" };
            return (
              <div
                key={item.level}
                style={{ width: `${pct}%` }}
                className={`${meta.color} h-full transition-all duration-500 hover:opacity-90`}
                title={`${meta.label}: ${count} (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>

        {/* Legend grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {data.map((item) => {
            const count = item.count || 0;
            const pct = Math.round((count / total) * 100);
            const meta = priorityMeta[item.level] || { label: item.level, color: "bg-primary", text: "text-primary" };
            return (
              <div key={item.level} className="p-2 rounded bg-base-200/50 border border-base-200 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${meta.color}`} />
                  <span className="text-xs font-semibold">{meta.label}</span>
                </div>
                <div className="text-lg font-black">{count}</div>
                <div className="text-[10px] text-base-content/60">{pct}% of total</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ShelterOccupancyGauge({ shelterData = {} }) {
  const capacity = shelterData.capacity || 0;
  const occupancy = shelterData.occupancy || 0;
  const rate = shelterData.rate || 0;
  const available = shelterData.available || 0;

  const getStatusColor = (rate) => {
    if (rate >= 90) return "text-error";
    if (rate >= 70) return "text-warning";
    return "text-success";
  };

  const getBarColor = (rate) => {
    if (rate >= 90) return "bg-error";
    if (rate >= 70) return "bg-warning";
    return "bg-success";
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-4 sm:p-5">
        <h3 className="card-title text-sm font-bold flex items-center justify-between">
          <span>🏠 Shelter Capacity Utilization</span>
          <span className={`text-xs font-bold badge ${rate >= 90 ? "badge-error" : rate >= 70 ? "badge-warning" : "badge-success"}`}>
            {rate}% Occupied
          </span>
        </h3>

        <div className="my-3 space-y-2">
          <div className="flex items-end justify-between">
            <div>
              <span className={`text-3xl font-black ${getStatusColor(rate)}`}>
                {occupancy}
              </span>
              <span className="text-xs text-base-content/70 ml-1">/ {capacity} total capacity</span>
            </div>
            <span className="text-xs font-semibold text-success">
              {available} spots available
            </span>
          </div>

          <div className="w-full bg-base-200 rounded-full h-3.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(rate)}`}
              style={{ width: `${Math.min(rate, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-base-200">
          <div className="text-base-content/70">
            Status: <span className="font-semibold text-base-content">{rate >= 90 ? "Near Full Capacity" : "Sufficient Space"}</span>
          </div>
          <div className="text-right text-base-content/70">
            Safety Margin: <span className="font-semibold text-base-content">{100 - rate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResourceInventoryBreakdown({ categories = {} }) {
  const categoryKeys = Object.keys(categories);
  const totalQuantity = Object.values(categories).reduce((a, b) => a + b, 0) || 1;

  const categoryIcons = {
    food: "🍲",
    water: "💧",
    medicine: "💊",
    clothing: "👕",
    shelter: "⛺",
    other: "📦",
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-4 sm:p-5">
        <h3 className="card-title text-sm font-bold flex items-center justify-between">
          <span>📦 Emergency Supply Inventory</span>
          <span className="text-xs font-normal badge badge-ghost">{categoryKeys.length} Categories</span>
        </h3>

        {categoryKeys.length === 0 ? (
          <div className="text-center py-6 text-xs text-base-content/60">
            No inventory records available.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3">
            {categoryKeys.map((cat) => {
              const qty = categories[cat];
              const icon = categoryIcons[cat.toLowerCase()] || "📦";
              return (
                <div key={cat} className="p-2.5 rounded-lg bg-base-200/60 border border-base-200">
                  <div className="flex items-center gap-1.5 text-xs text-base-content/70 capitalize font-medium">
                    <span>{icon}</span>
                    <span>{cat}</span>
                  </div>
                  <div className="text-lg font-black mt-1 text-base-content">
                    {qty.toLocaleString()} <span className="text-xs font-normal text-base-content/60">units</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

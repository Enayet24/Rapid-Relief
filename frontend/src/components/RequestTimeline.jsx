import React from "react";

/**
 * Visual Request Tracking Timeline Component
 * Module: Emergency Request Tracking (Israt Jahan Lamia)
 * Displays step-by-step incident resolution timeline
 */
export default function RequestTimeline({ status = "pending", history = [], completionReport }) {
  // Normalize status step index
  const getStepIndex = (st) => {
    switch (st?.toLowerCase()) {
      case "pending":
      case "unassigned":
        return 1;
      case "assigned":
        return 2;
      case "in_progress":
      case "in-progress":
        return 3;
      case "resolved":
      case "completed":
        return 4;
      default:
        return 1;
    }
  };

  const currentStepIndex = getStepIndex(status);

  const steps = [
    {
      step: 1,
      title: "Request Created",
      desc: "Emergency call registered",
      icon: "🆘",
    },
    {
      step: 2,
      title: "Volunteer Assigned",
      desc: "Responder dispatched",
      icon: "🦺",
    },
    {
      step: 3,
      title: "Rescue In-Progress",
      desc: "Field operations underway",
      icon: "🚑",
    },
    {
      step: 4,
      title: "Mission Resolved",
      desc: "Victims safe / task completed",
      icon: "✅",
    },
  ];

  return (
    <div className="w-full bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-base-200 pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/80 flex items-center gap-1.5">
          <span>⏱️</span>
          <span>Emergency Request Timeline</span>
        </h4>
        <span
          className={`badge badge-sm font-semibold capitalize ${
            currentStepIndex === 4
              ? "badge-success text-white"
              : currentStepIndex === 3
              ? "badge-primary"
              : currentStepIndex === 2
              ? "badge-info text-white"
              : "badge-warning"
          }`}
        >
          {status.replace("_", " ")}
        </span>
      </div>

      {/* Visual Timeline Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative">
        {steps.map((s) => {
          const isDone = s.step <= currentStepIndex;
          const isCurrent = s.step === currentStepIndex;

          return (
            <div
              key={s.step}
              className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center justify-between ${
                isDone
                  ? isCurrent
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-success/40 bg-success/5"
                  : "border-base-200 opacity-60 bg-base-200/40"
              }`}
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-bold text-xs text-base-content">{s.title}</div>
              <div className="text-[10px] text-base-content/60 mt-0.5">{s.desc}</div>

              <div className="mt-2">
                {isDone ? (
                  <span className="badge badge-xs badge-success text-white font-bold">Done ✓</span>
                ) : (
                  <span className="badge badge-xs badge-ghost">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Report Details (If Resolved) */}
      {completionReport && completionReport.notes && (
        <div className="mt-3 p-3 bg-success/10 border border-success/30 rounded-lg text-xs">
          <div className="font-bold text-success flex items-center gap-1">
            <span>📝 Completion Field Report:</span>
          </div>
          <p className="text-base-content/80 mt-1 italic">"{completionReport.notes}"</p>
          {completionReport.resolvedAt && (
            <div className="text-[10px] text-base-content/60 mt-1 text-right">
              Resolved on: {new Date(completionReport.resolvedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Incident History Log */}
      {history && history.length > 0 && (
        <div className="pt-2 border-t border-base-200">
          <div className="text-[11px] font-semibold text-base-content/70 mb-1">Status History:</div>
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {history.map((h, i) => (
              <div key={i} className="text-[11px] flex justify-between text-base-content/70">
                <span>
                  • <strong className="capitalize">{h.status.replace("_", " ")}</strong>: {h.note || "No details"}
                </span>
                <span className="text-[10px] text-base-content/50 ml-2">
                  {new Date(h.changedAt || h.timestamp || Date.now()).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

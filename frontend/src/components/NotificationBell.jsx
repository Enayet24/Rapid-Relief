import { useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext.jsx";

const TYPE_ICON = {
  request_confirmed: "✅",
  volunteer_assigned: "🦺",
  status_updated: "🔄",
  shelter_announcement: "🏠",
  general: "🔔",
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className={`dropdown dropdown-end ${open ? "dropdown-open" : ""}`}>
      <button
        className="btn btn-ghost btn-sm btn-circle indicator"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="badge badge-error badge-xs indicator-item">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="dropdown-content menu p-0 shadow-lg bg-base-100 rounded-box w-80 mt-2 border border-base-200 z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-base-200">
            <span className="font-bold text-sm">Notifications</span>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-primary font-medium"
            >
              View all
            </Link>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-xs text-base-content/60 py-6">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => {
                    if (!n.isRead) markAsRead(n._id);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-base-200 last:border-0 hover:bg-base-200 transition-colors ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-2 items-start">
                    <span>{TYPE_ICON[n.type] || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${!n.isRead ? "font-semibold" : "text-base-content/70"}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-base-content/50 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
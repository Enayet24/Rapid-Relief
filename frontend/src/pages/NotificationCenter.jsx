import { useEffect, useState, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import Pagination from "../components/Pagination";
import { useNotifications } from "../context/NotificationContext.jsx";

const TYPE_ICON = {
  request_confirmed: "✅",
  volunteer_assigned: "🦺",
  status_updated: "🔄",
  shelter_announcement: "🏠",
  general: "🔔",
};

export default function NotificationCenter() {
  const { markAllAsRead, refresh } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | unread

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get("/notifications", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          unreadOnly: filter === "unread" ? "true" : undefined,
        },
      });
      setNotifications(data.notifications || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkOne = async (id) => {
    await axiosClient.patch(`/notifications/${id}/read`);
    load();
    refresh();
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">🔔 Notification Center</h1>
          <p className="text-xs text-base-content/70">All updates related to your account and requests.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
            className="select select-sm select-bordered text-xs"
          >
            <option value="all">All</option>
            <option value="unread">Unread only</option>
          </select>
          <button onClick={handleMarkAll} className="btn btn-sm btn-ghost">
            Mark all as read
          </button>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-xs text-base-content/60">No notifications found.</div>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`flex gap-3 items-start px-4 py-3 border-b border-base-200 last:border-0 ${
                  !n.isRead ? "bg-primary/5" : ""
                }`}
              >
                <span className="text-lg">{TYPE_ICON[n.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? "font-semibold" : "text-base-content/70"}`}>
                    {n.message}
                  </p>
                  <p className="text-[11px] text-base-content/50 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.isRead && (
                  <button onClick={() => handleMarkOne(n._id)} className="btn btn-xs btn-ghost">
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="p-3 border-t border-base-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(l) => { setItemsPerPage(l); setCurrentPage(1); }}
          />
        </div>
      </div>
    </div>
  );
}
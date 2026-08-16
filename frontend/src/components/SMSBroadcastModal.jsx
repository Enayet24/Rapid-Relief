import { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";

/**
 * SMS Notification Integration & Broadcast Console
 * Module 3 - Assigned to: Ariful Islam Bijoy (ID: 22101504)
 */
export default function SMSBroadcastModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("broadcast"); // 'broadcast' | 'logs'
  const [targetRole, setTargetRole] = useState("all");
  const [customPhone, setCustomPhone] = useState("");
  const [message, setMessage] = useState("");
  const [statusInfo, setStatusInfo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const SMS_TEMPLATES = [
    {
      title: "🌊 Flood Evacuation Alert",
      text: "FLOOD WARNING: Rising water levels reported. Please move to the nearest designated shelter immediately. Emergency teams deployed.",
    },
    {
      title: "🌀 Cyclone Preparedness Alert",
      text: "CYCLONE ALERT: Severe winds expected. Seek secure shelter, secure essential documents and prepare emergency food and clean water.",
    },
    {
      title: "🦺 Volunteer Rescue Callout",
      text: "URGENT RESCUE DISPATCH: High priority rescue operations needed in flood-affected sectors. Volunteers please check your mission board.",
    },
    {
      title: "🏠 Shelter Capacity Notice",
      text: "SHELTER ANNOUNCEMENT: New emergency shelter opened with food and medical supplies. Contact response coordinator for directions.",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchStatusAndLogs();
    }
  }, [isOpen]);

  const fetchStatusAndLogs = async () => {
    try {
      const res = await axiosClient.get("/sms/logs");
      setStatusInfo(res.data.status);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.warn("Failed to fetch SMS status:", err);
    }
  };

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      if (targetRole === "custom") {
        if (!customPhone || !message) {
          throw new Error("Recipient phone and message text are required");
        }
        await axiosClient.post("/sms/send", {
          to: customPhone,
          body: message,
          type: "admin_direct_sms",
        });
        setSuccessMsg(`Direct SMS successfully dispatched to ${customPhone}!`);
      } else {
        if (!message) {
          throw new Error("Broadcast message cannot be empty");
        }
        const res = await axiosClient.post("/sms/broadcast", {
          message,
          targetRole,
          alertType: "admin_emergency_broadcast",
        });
        setSuccessMsg(
          `Broadcast alert sent! Dispatched to ${res.data.dispatchedCount} registered ${targetRole === "all" ? "users" : targetRole + "s"}.`
        );
      }
      setMessage("");
      fetchStatusAndLogs();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to dispatch SMS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-base-200">
          <div>
            <h3 className="font-bold text-lg text-base-content flex items-center gap-2">
              <span>📱 Twilio SMS Notification Center</span>
              {statusInfo && (
                <span className={`badge badge-sm font-semibold ${statusInfo.mode === "live" ? "badge-success" : "badge-info"}`}>
                  {statusInfo.mode === "live" ? "🟢 Live Twilio API" : "⚙️ Simulation Mode"}
                </span>
              )}
            </h3>
            <p className="text-xs text-base-content/70">
              Integrated SMS alerts for critical incidents, rescue missions, and emergency broadcasts.
            </p>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed my-3 bg-base-200 p-1">
          <button
            onClick={() => setActiveTab("broadcast")}
            className={`tab tab-sm flex-1 font-semibold ${activeTab === "broadcast" ? "tab-active" : ""}`}
          >
            📢 Send SMS Alert
          </button>
          <button
            onClick={() => {
              setActiveTab("logs");
              fetchStatusAndLogs();
            }}
            className={`tab tab-sm flex-1 font-semibold ${activeTab === "logs" ? "tab-active" : ""}`}
          >
            📋 SMS Dispatch Logs ({logs.length})
          </button>
        </div>

        {successMsg && (
          <div className="alert alert-success text-xs py-2 my-2">
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-error text-xs py-2 my-2">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Compose & Broadcast */}
        {activeTab === "broadcast" && (
          <form onSubmit={handleSend} className="space-y-3">
            {/* Quick Templates */}
            <div>
              <label className="text-xs font-semibold text-base-content/80 block mb-1">
                ⚡ Quick Emergency Alert Templates:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {SMS_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMessage(tmpl.text)}
                    className="btn btn-xs btn-outline btn-ghost justify-start text-left truncate"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Target Audience</span>
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="select select-bordered select-sm"
                >
                  <option value="all">🌐 All Registered Users (Citizens & Volunteers)</option>
                  <option value="volunteer">🦺 Rescue Volunteers Only</option>
                  <option value="citizen">👤 Citizens Only</option>
                  <option value="custom">📞 Custom Phone Number</option>
                </select>
              </div>

              {targetRole === "custom" && (
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs font-semibold">Recipient Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+8801700000000"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="input input-bordered input-sm"
                    required
                  />
                </div>
              )}
            </div>

            {/* Message Body */}
            <div className="form-control">
              <div className="flex justify-between items-center py-1">
                <label className="label-text text-xs font-semibold">SMS Message Body</label>
                <span className="text-[11px] text-base-content/60">
                  {message.length} / 160 characters (1 SMS segment)
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter urgent disaster notification or evacuation instructions..."
                className="textarea textarea-bordered h-24 text-xs font-sans"
                required
              />
            </div>

            {/* Live Preview Box */}
            {message && (
              <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                <div className="text-[10px] uppercase font-bold text-base-content/60 mb-1">
                  📱 SMS Message Preview
                </div>
                <div className="bg-base-100 p-2.5 rounded text-xs text-base-content font-mono border border-base-300">
                  📢 [RAPID RELIEF EMERGENCY BROADCAST] {message}
                </div>
              </div>
            )}

            <div className="modal-action">
              <button type="button" onClick={onClose} className="btn btn-sm btn-ghost">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !message}
                className="btn btn-sm btn-primary"
              >
                {loading ? "Dispatching SMS..." : "🚀 Send SMS Notification"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Transmission Logs */}
        {activeTab === "logs" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-base-content/70">
                Recent SMS notifications recorded during this session:
              </span>
              <button
                onClick={fetchStatusAndLogs}
                className="btn btn-xs btn-ghost"
              >
                🔄 Refresh Logs
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-8 bg-base-200/50 rounded-lg text-xs text-base-content/60">
                No SMS messages transmitted yet. Try sending an emergency alert.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-72 overflow-y-auto border border-base-200 rounded-lg">
                <table className="table table-xs">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Recipient</th>
                      <th>Type</th>
                      <th>Message</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="whitespace-nowrap text-[11px] text-base-content/70">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="font-mono text-xs font-semibold">{log.to}</td>
                        <td>
                          <span className="badge badge-xs badge-outline capitalize">
                            {log.type?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="max-w-[200px] truncate text-[11px] font-sans">
                          {log.body}
                        </td>
                        <td>
                          <span className={`badge badge-xs ${log.status === "delivered" ? "badge-success" : "badge-error"}`}>
                            {log.mode === "simulated" ? "Simulated ✓" : log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-action">
              <button onClick={onClose} className="btn btn-sm btn-ghost">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import axiosClient from "../api/axiosClient";

/**
 * Report Generation & Export Modal
 * Module 1 - Assigned to: Ariful Islam Bijoy (ID: 22101504)
 */
export default function ReportModal({ isOpen, onClose }) {
  const [reportType, setReportType] = useState("requests");
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFetchPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(`/analytics/reports?reportType=${reportType}&format=json`);
      setPreviewData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate report preview");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    const token = localStorage.getItem("token");
    const baseURL = axiosClient.defaults.baseURL || "http://localhost:5000/api";
    const url = `${baseURL}/analytics/reports?reportType=${reportType}&format=csv`;

    // Download via link with auth or fetch blob
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `rapid_relief_${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => setError("Failed to download CSV: " + err.message));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3 border-base-200">
          <div>
            <h3 className="font-bold text-lg text-base-content flex items-center gap-2">
              <span>📑 Disaster Relief Report Generator</span>
            </h3>
            <p className="text-xs text-base-content/70">
              Generate structured operational summaries for administrative review & NGO coordination.
            </p>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>

        {error && (
          <div className="alert alert-error text-xs my-3 py-2">
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs font-semibold">Select Report Type</span>
            </label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setPreviewData(null);
              }}
              className="select select-bordered select-sm w-full"
            >
              <option value="requests">🚨 Emergency Requests Report</option>
              <option value="shelters">🏠 Shelters Status Report</option>
              <option value="resources">📦 Resource Inventory Report</option>
            </select>
          </div>

          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              onClick={handleFetchPreview}
              disabled={loading}
              className="btn btn-sm btn-outline btn-primary flex-1"
            >
              {loading ? "Generating..." : "🔍 Preview Report"}
            </button>
            <button
              onClick={handleDownloadCSV}
              className="btn btn-sm btn-primary flex-1"
            >
              📥 Download CSV
            </button>
            {previewData && (
              <button
                onClick={handlePrint}
                className="btn btn-sm btn-secondary"
              >
                🖨️ Print
              </button>
            )}
          </div>
        </div>

        {/* Report Preview Container */}
        {previewData && (
          <div className="bg-base-200/60 rounded-xl p-4 border border-base-300 mt-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-base-300 mb-3">
              <div>
                <h4 className="font-bold text-sm text-base-content uppercase tracking-wide">
                  {previewData.reportType}
                </h4>
                <p className="text-[11px] text-base-content/60">
                  Generated at: {new Date(previewData.generatedAt).toLocaleString()}
                </p>
              </div>
              <span className="badge badge-primary font-bold">
                {previewData.totalRecords} Records
              </span>
            </div>

            <div className="overflow-x-auto max-h-60 overflow-y-auto">
              <table className="table table-xs table-pin-rows">
                <thead>
                  {reportType === "requests" && (
                    <tr>
                      <th>Disaster</th>
                      <th>Assistance</th>
                      <th>Affected</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Location</th>
                    </tr>
                  )}
                  {reportType === "shelters" && (
                    <tr>
                      <th>Shelter Name</th>
                      <th>Address</th>
                      <th>Capacity</th>
                      <th>Occupancy</th>
                      <th>Status</th>
                    </tr>
                  )}
                  {reportType === "resources" && (
                    <tr>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Threshold</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {previewData.data?.slice(0, 15).map((item, idx) => (
                    <tr key={item._id || idx}>
                      {reportType === "requests" && (
                        <>
                          <td className="capitalize font-semibold">{item.disasterType}</td>
                          <td className="capitalize">{item.assistanceTypeRequired}</td>
                          <td>{item.numberOfAffectedIndividuals}</td>
                          <td><span className="badge badge-xs">{item.priorityLevel}</span></td>
                          <td><span className="badge badge-xs badge-ghost">{item.status}</span></td>
                          <td className="truncate max-w-[150px]">{item.location?.address || "N/A"}</td>
                        </>
                      )}
                      {reportType === "shelters" && (
                        <>
                          <td className="font-semibold">{item.name}</td>
                          <td>{item.location?.address}</td>
                          <td>{item.capacity}</td>
                          <td>{item.currentOccupancy}</td>
                          <td><span className="badge badge-xs">{item.status}</span></td>
                        </>
                      )}
                      {reportType === "resources" && (
                        <>
                          <td className="font-semibold">{item.name}</td>
                          <td className="capitalize">{item.category}</td>
                          <td className="font-bold">{item.quantity}</td>
                          <td>{item.unit}</td>
                          <td>{item.lowStockThreshold}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.totalRecords > 15 && (
              <p className="text-[11px] text-center text-base-content/60 mt-2">
                ... Showing 15 of {previewData.totalRecords} records. Download CSV for the complete dataset.
              </p>
            )}
          </div>
        )}

        <div className="modal-action">
          <button onClick={onClose} className="btn btn-sm btn-ghost">Close</button>
        </div>
      </div>
    </div>
  );
}

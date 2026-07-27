import { useState } from "react";
import axiosClient from "../api/axiosClient";

const DISASTER_TYPES = ["flood", "cyclone", "earthquake", "fire", "landslide", "other"];
const ASSISTANCE_TYPES = ["rescue", "medical", "food", "shelter", "water", "other"];

export default function RequestForm() {
  const [form, setForm] = useState({
    disasterType: "flood",
    assistanceTypeRequired: "rescue",
    numberOfAffectedIndividuals: 1,
    description: "",
    address: "",
    lat: "",
    lng: "",
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      const payload = {
        disasterType: form.disasterType,
        assistanceTypeRequired: form.assistanceTypeRequired,
        numberOfAffectedIndividuals: Number(form.numberOfAffectedIndividuals),
        description: form.description,
        location: {
          type: "Point",
          coordinates: [Number(form.lng) || 0, Number(form.lat) || 0],
          address: form.address,
        },
      };
      await axiosClient.post("/requests", payload);
      setStatus("success");
    } catch (err) {
      setStatus(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="card bg-base-100 shadow-md max-w-xl mx-auto">
      <div className="card-body">
        <h2 className="card-title">Report an Emergency</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="form-control">
            <span className="label-text">Disaster Type</span>
            <select
              name="disasterType"
              value={form.disasterType}
              onChange={handleChange}
              className="select select-bordered"
            >
              {DISASTER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label-text">Assistance Needed</span>
            <select
              name="assistanceTypeRequired"
              value={form.assistanceTypeRequired}
              onChange={handleChange}
              className="select select-bordered"
            >
              {ASSISTANCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label-text">Number of Affected Individuals</span>
            <input
              type="number"
              name="numberOfAffectedIndividuals"
              min="1"
              value={form.numberOfAffectedIndividuals}
              onChange={handleChange}
              className="input input-bordered"
            />
          </label>

          <label className="form-control">
            <span className="label-text">Address</span>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="input input-bordered"
              placeholder="Will be replaced by Google Maps picker"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label-text">Latitude</span>
              <input
                type="number"
                step="any"
                name="lat"
                value={form.lat}
                onChange={handleChange}
                className="input input-bordered"
              />
            </label>
            <label className="form-control">
              <span className="label-text">Longitude</span>
              <input
                type="number"
                step="any"
                name="lng"
                value={form.lng}
                onChange={handleChange}
                className="input input-bordered"
              />
            </label>
          </div>

          <label className="form-control">
            <span className="label-text">Description (mention injuries, trapped individuals, etc.)</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="textarea textarea-bordered"
              rows={3}
            />
          </label>

          <button type="submit" className="btn btn-primary mt-2" disabled={status === "submitting"}>
            {status === "submitting" ? "Submitting..." : "Submit Request"}
          </button>

          {status === "success" && <div className="alert alert-success">Request submitted successfully.</div>}
          {status && status !== "submitting" && status !== "success" && (
            <div className="alert alert-error">{status}</div>
          )}
        </form>
      </div>
    </div>
  );
}

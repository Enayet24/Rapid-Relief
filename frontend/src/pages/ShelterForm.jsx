import { useState } from "react";
import axiosClient from "../api/axiosClient";

export default function ShelterForm() {
  const [form, setForm] = useState({
    name: "",
    address: "",
    lat: "",
    lng: "",
    capacity: 50,
    contactPerson: "",
    contactPhone: "",
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      await axiosClient.post("/shelters", {
        name: form.name,
        capacity: Number(form.capacity),
        contactPerson: form.contactPerson,
        contactPhone: form.contactPhone,
        location: {
          type: "Point",
          coordinates: [Number(form.lng) || 0, Number(form.lat) || 0],
          address: form.address,
        },
      });
      setStatus("success");
    } catch (err) {
      setStatus(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="card bg-base-100 shadow-md max-w-xl mx-auto">
      <div className="card-body">
        <h2 className="card-title">Register a Shelter</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="form-control">
            <span className="label-text">Shelter Name</span>
            <input name="name" value={form.name} onChange={handleChange} className="input input-bordered" required />
          </label>

          <label className="form-control">
            <span className="label-text">Address</span>
            <input name="address" value={form.address} onChange={handleChange} className="input input-bordered" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label-text">Latitude</span>
              <input type="number" step="any" name="lat" value={form.lat} onChange={handleChange} className="input input-bordered" />
            </label>
            <label className="form-control">
              <span className="label-text">Longitude</span>
              <input type="number" step="any" name="lng" value={form.lng} onChange={handleChange} className="input input-bordered" />
            </label>
          </div>

          <label className="form-control">
            <span className="label-text">Capacity</span>
            <input type="number" min="1" name="capacity" value={form.capacity} onChange={handleChange} className="input input-bordered" />
          </label>

          <label className="form-control">
            <span className="label-text">Contact Person</span>
            <input name="contactPerson" value={form.contactPerson} onChange={handleChange} className="input input-bordered" />
          </label>

          <label className="form-control">
            <span className="label-text">Contact Phone</span>
            <input name="contactPhone" value={form.contactPhone} onChange={handleChange} className="input input-bordered" />
          </label>

          <button type="submit" className="btn btn-primary mt-2" disabled={status === "submitting"}>
            {status === "submitting" ? "Saving..." : "Register Shelter"}
          </button>

          {status === "success" && <div className="alert alert-success">Shelter registered.</div>}
          {status && status !== "submitting" && status !== "success" && (
            <div className="alert alert-error">{status}</div>
          )}
        </form>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

export default function DonationList() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ donorName: "", donationType: "cash", amount: "", itemDescription: "", quantity: "" });

  const load = () => {
    axiosClient.get("/donations").then((res) => setDonations(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await axiosClient.post("/donations", {
      donorName: form.donorName,
      donationType: form.donationType,
      amount: form.amount ? Number(form.amount) : undefined,
      itemDescription: form.itemDescription,
      quantity: form.quantity ? Number(form.quantity) : undefined,
    });
    setForm({ donorName: "", donationType: "cash", amount: "", itemDescription: "", quantity: "" });
    load();
  };

  if (loading) return <span className="loading loading-spinner loading-lg" />;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="card bg-base-100 shadow-md p-4 flex flex-row flex-wrap gap-3 items-end">
        <input
          placeholder="Donor name"
          value={form.donorName}
          onChange={(e) => setForm({ ...form, donorName: e.target.value })}
          className="input input-bordered"
          required
        />
        <select
          value={form.donationType}
          onChange={(e) => setForm({ ...form, donationType: e.target.value })}
          className="select select-bordered"
        >
          <option value="cash">Cash</option>
          <option value="goods">Goods</option>
        </select>
        {form.donationType === "cash" ? (
          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="input input-bordered w-32"
          />
        ) : (
          <>
            <input
              placeholder="Item description"
              value={form.itemDescription}
              onChange={(e) => setForm({ ...form, itemDescription: e.target.value })}
              className="input input-bordered"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="input input-bordered w-28"
            />
          </>
        )}
        <button type="submit" className="btn btn-primary">Record Donation</button>
      </form>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Donor</th><th>Type</th><th>Details</th><th>Status</th><th>Received</th></tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d._id}>
                <td>{d.donorName}</td>
                <td className="capitalize">{d.donationType}</td>
                <td>{d.donationType === "cash" ? `৳${d.amount}` : `${d.quantity} × ${d.itemDescription}`}</td>
                <td><span className="badge badge-ghost capitalize">{d.status}</span></td>
                <td>{new Date(d.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {donations.length === 0 && (
              <tr><td colSpan={5} className="text-center py-6 opacity-60">No donations recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
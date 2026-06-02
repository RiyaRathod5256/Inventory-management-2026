import { useState, useEffect } from "react";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerOrders } from "../api/client.js";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-amber-100 text-amber-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const emptyForm = { email: "", first_name: "", last_name: "", phone: "" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [orders, setOrders] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCustomer, setDrawerCustomer] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await getCustomers(search);
      setCustomers(res.data);
    } catch { setError("Failed to load customers"); }
  };

  useEffect(() => { load(); }, [search]);

  const openAdd = () => { setForm(emptyForm); setError(""); setModal("add"); };
  const openEdit = (c) => { setSelected(c); setForm({ email: c.email, first_name: c.first_name, last_name: c.last_name, phone: c.phone || "" }); setError(""); setModal("edit"); };
  const openDelete = (c) => { setSelected(c); setError(""); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelected(null); setError(""); };

  const openDrawer = async (c) => {
    setDrawerCustomer(c);
    setDrawerOpen(true);
    try {
      const res = await getCustomerOrders(c.id);
      setOrders(res.data);
    } catch { setOrders([]); }
  };

  const handleSave = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (modal === "add") await createCustomer(form);
      else await updateCustomer(selected.id, form);
      closeModal(); load();
    } catch (err) {
      setError(err.response?.data?.detail || "Save failed");
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setError(""); setLoading(true);
    try {
      await deleteCustomer(selected.id);
      closeModal(); load();
    } catch (err) {
      setError(err.response?.data?.detail || "Delete failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Customers</h1>
        <button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-medium">
          + Add Customer
        </button>
      </div>

      <input
        type="text" placeholder="Search by name or email…"
        value={search} onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b text-gray-600 font-medium">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">No customers found</td></tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <button onClick={() => openDrawer(c)} className="font-medium text-indigo-600 hover:underline">
                    {c.first_name} {c.last_name}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.email}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button onClick={() => openEdit(c)} className="px-2 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded">Edit</button>
                  <button onClick={() => openDelete(c)} className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Add Customer" : "Edit Customer"} onClose={closeModal}>
          {error && <div className="mb-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</div>}
          <form onSubmit={handleSave} className="space-y-3">
            {[["first_name", "First Name"], ["last_name", "Last Name"], ["email", "Email"], ["phone", "Phone"]].map(([f, label]) => (
              <div key={f}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type={f === "email" ? "email" : "text"}
                  value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  required={f !== "phone"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {modal === "delete" && (
        <Modal title="Delete Customer" onClose={closeModal}>
          {error && <div className="mb-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</div>}
          <p className="text-sm text-gray-600 mb-4">Delete <strong>{selected?.first_name} {selected?.last_name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handleDelete} disabled={loading} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}

      {/* Order History Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">
                Orders — {drawerCustomer?.first_name} {drawerCustomer?.last_name}
              </h2>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            {orders.length === 0 ? (
              <p className="text-gray-400 text-sm">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-xs text-gray-500">{o.id.slice(0, 8)}…</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-800">${parseFloat(o.total_amount).toFixed(2)}</div>
                    <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

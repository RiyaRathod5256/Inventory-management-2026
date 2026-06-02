import { useState, useEffect } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct, adjustStock } from "../api/client.js";

function stockColor(qty) {
  if (qty === 0) return "text-red-600 font-semibold";
  if (qty < 10) return "text-amber-600 font-semibold";
  return "text-green-600";
}

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

const emptyForm = { sku: "", name: "", description: "", price: "", stock_quantity: "0" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'stock' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [stockAdj, setStockAdj] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await getProducts(search);
      setProducts(res.data);
    } catch {
      setError("Failed to load products");
    }
  };

  useEffect(() => { load(); }, [search]);

  const openAdd = () => { setForm(emptyForm); setError(""); setModal("add"); };
  const openEdit = (p) => {
    setSelected(p);
    setForm({ sku: p.sku, name: p.name, description: p.description || "", price: p.price, stock_quantity: p.stock_quantity });
    setError("");
    setModal("edit");
  };
  const openStock = (p) => { setSelected(p); setStockAdj(""); setError(""); setModal("stock"); };
  const openDelete = (p) => { setSelected(p); setError(""); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelected(null); setError(""); };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity) };
      if (modal === "add") await createProduct(payload);
      else await updateProduct(selected.id, payload);
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Save failed");
    } finally { setLoading(false); }
  };

  const handleStockAdj = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await adjustStock(selected.id, parseInt(stockAdj));
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Adjustment failed");
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setError(""); setLoading(true);
    try {
      await deleteProduct(selected.id);
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Delete failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Products</h1>
        <button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
          + Add Product
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name or SKU…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b text-gray-600 font-medium">
            <tr>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No products found</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-right">${parseFloat(p.price).toFixed(2)}</td>
                <td className={`px-4 py-3 text-right ${stockColor(p.stock_quantity)}`}>{p.stock_quantity}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button onClick={() => openStock(p)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">± Stock</button>
                  <button onClick={() => openEdit(p)} className="px-2 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded">Edit</button>
                  <button onClick={() => openDelete(p)} className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Add Product" : "Edit Product"} onClose={closeModal}>
          {error && <div className="mb-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</div>}
          <form onSubmit={handleSave} className="space-y-3">
            {["sku", "name", "price"].map((f) => (
              <div key={f}>
                <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{f}</label>
                <input
                  type={f === "price" ? "number" : "text"}
                  step={f === "price" ? "0.01" : undefined}
                  min={f === "price" ? "0" : undefined}
                  value={form[f]}
                  onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stock Quantity</label>
              <input
                type="number" min="0" value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Stock Adjustment Modal */}
      {modal === "stock" && (
        <Modal title={`Adjust Stock — ${selected?.name}`} onClose={closeModal}>
          <p className="text-sm text-gray-500 mb-3">Current stock: <strong>{selected?.stock_quantity}</strong></p>
          {error && <div className="mb-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</div>}
          <form onSubmit={handleStockAdj} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Adjustment (use negative to remove)</label>
              <input
                type="number" value={stockAdj}
                onChange={(e) => setStockAdj(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="e.g. +50 or -10"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                {loading ? "Applying…" : "Apply"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {modal === "delete" && (
        <Modal title="Delete Product" onClose={closeModal}>
          {error && <div className="mb-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</div>}
          <p className="text-sm text-gray-600 mb-4">Delete <strong>{selected?.name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handleDelete} disabled={loading} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

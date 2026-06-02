import { useState, useEffect } from "react";
import { getOrders, getProducts, getCustomers, createOrder, updateOrderStatus } from "../api/client.js";

const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-amber-100 text-amber-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const ALL_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className={`bg-white rounded-xl shadow-xl w-full mx-4 ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [custSearch, setCustSearch] = useState("");
  const [prodSearch, setProdSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await getOrders(params);
      setOrders(res.data);
    } catch { setError("Failed to load orders"); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openNew = async () => {
    setStep(1); setSelectedCustomer(null); setLineItems([]); setNotes(""); setError("");
    setCustSearch(""); setProdSearch("");
    const [cr, pr] = await Promise.all([getCustomers(), getProducts()]);
    setCustomers(cr.data);
    setProducts(pr.data);
    setModal("new");
  };

  const closeModal = () => { setModal(null); setError(""); };

  const addLineItem = (product) => {
    const existing = lineItems.find((li) => li.product_id === product.id);
    if (existing) {
      setLineItems(lineItems.map((li) =>
        li.product_id === product.id ? { ...li, quantity: li.quantity + 1 } : li
      ));
    } else {
      setLineItems([...lineItems, { product_id: product.id, product, quantity: 1 }]);
    }
  };

  const updateQty = (product_id, qty) => {
    if (qty < 1) {
      setLineItems(lineItems.filter((li) => li.product_id !== product_id));
    } else {
      setLineItems(lineItems.map((li) => li.product_id === product_id ? { ...li, quantity: qty } : li));
    }
  };

  const orderTotal = lineItems.reduce((sum, li) => sum + parseFloat(li.product.price) * li.quantity, 0);

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      await createOrder({
        customer_id: selectedCustomer.id,
        items: lineItems.map((li) => ({ product_id: li.product_id, quantity: li.quantity })),
        notes,
      });
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create order");
    } finally { setLoading(false); }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || "Status update failed");
    }
  };

  const filteredCustomers = customers.filter((c) =>
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(custSearch.toLowerCase())
  );
  const filteredProducts = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(prodSearch.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Orders</h1>
        <button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-medium">
          + New Order
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${!statusFilter ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          All
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-colors ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b text-gray-600 font-medium">
            <tr>
              <th className="px-4 py-3 text-left">Order ID</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No orders found</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.id.slice(0, 8)}…</td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {o.customer ? `${o.customer.first_name} ${o.customer.last_name}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium">${parseFloat(o.total_amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Order Multi-Step Modal */}
      {modal === "new" && (
        <Modal title={`New Order — Step ${step} of 3`} onClose={closeModal} wide>
          {error && <div className="mb-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</div>}

          {/* Step 1: Select Customer */}
          {step === 1 && (
            <div>
              <p className="text-sm text-gray-500 mb-3">Search and select a customer</p>
              <input
                type="text" placeholder="Search customers…" value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCustomer?.id === c.id ? "bg-indigo-100 border border-indigo-300" : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <span className="font-medium">{c.first_name} {c.last_name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{c.email}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setStep(2)} disabled={!selectedCustomer}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Add Line Items */}
          {step === 2 && (
            <div>
              <p className="text-sm text-gray-500 mb-3">Add products to the order</p>
              <input
                type="text" placeholder="Search products…" value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 border border-transparent">
                    <div>
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{p.sku}</span>
                      <span className="text-xs text-gray-500 ml-2">${parseFloat(p.price).toFixed(2)}</span>
                      <span className={`text-xs ml-2 ${p.stock_quantity === 0 ? "text-red-500" : "text-gray-400"}`}>
                        ({p.stock_quantity} in stock)
                      </span>
                    </div>
                    <button
                      onClick={() => addLineItem(p)}
                      disabled={p.stock_quantity === 0}
                      className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded disabled:opacity-40"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>

              {lineItems.length > 0 && (
                <div className="border rounded-lg overflow-hidden mb-3">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left">Product</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((li) => (
                        <tr key={li.product_id} className="border-t">
                          <td className="px-3 py-2">{li.product.name}</td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number" min="0" value={li.quantity}
                              onChange={(e) => updateQty(li.product_id, parseInt(e.target.value))}
                              className="w-14 text-center border border-gray-200 rounded px-1 py-0.5"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">${(parseFloat(li.product.price) * li.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="flex justify-between mt-4">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">← Back</button>
                <button onClick={() => setStep(3)} disabled={lineItems.length === 0}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  Review →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <p className="text-sm text-gray-500 mb-3">Review your order before placing it</p>
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500 mb-1">Customer</p>
                <p className="font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                <p className="text-xs text-gray-500">{selectedCustomer.email}</p>
              </div>
              <div className="border rounded-lg overflow-hidden mb-3">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Unit</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li) => (
                      <tr key={li.product_id} className="border-t">
                        <td className="px-3 py-2">{li.product.name}</td>
                        <td className="px-3 py-2 text-center">{li.quantity}</td>
                        <td className="px-3 py-2 text-right">${parseFloat(li.product.price).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">${(parseFloat(li.product.price) * li.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 font-semibold text-right">Total</td>
                      <td className="px-3 py-2 font-semibold text-right">${orderTotal.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {notes && <p className="text-xs text-gray-500 mb-3">Notes: {notes}</p>}
              {error && <div className="mb-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</div>}
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">← Back</button>
                <button onClick={handleSubmit} disabled={loading}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60">
                  {loading ? "Placing…" : "Place Order"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

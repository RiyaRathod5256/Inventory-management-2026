import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (username, password) => {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  return api.post("/auth/token", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts = (search = "") =>
  api.get("/products", { params: search ? { search } : {} });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post("/products", data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const adjustStock = (id, adjustment) =>
  api.patch(`/products/${id}/stock`, { adjustment });

// ── Customers ─────────────────────────────────────────────────────────────────
export const getCustomers = (search = "") =>
  api.get("/customers", { params: search ? { search } : {} });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const getCustomerOrders = (id) => api.get(`/customers/${id}/orders`);
export const createCustomer = (data) => api.post("/customers", data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// ── Orders ────────────────────────────────────────────────────────────────────
export const getOrders = (params = {}) => api.get("/orders", { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post("/orders", data);
export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status });

import { BrowserRouter, Routes, Route, NavLink, Navigate,useNavigate} from "react-router-dom";
import { useState, useEffect } from "react";
import Products from "./pages/Products.jsx";
import Customers from "./pages/Customers.jsx";
import Orders from "./pages/Orders.jsx";
import Login from "./pages/Login.jsx";

function Layout({ children }) {
  const navigate = useNavigate();

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? "bg-indigo-700 text-white" : "text-indigo-100 hover:bg-indigo-700/60"
    }`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-indigo-800 flex flex-col">
        <div className="px-5 py-5 border-b border-indigo-700">
          <h1 className="text-white font-bold text-lg leading-tight">Inventory<br/>Manager</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/products" className={navClass}>
            <span>📦</span> Products
          </NavLink>
          <NavLink to="/customers" className={navClass}>
            <span>👥</span> Customers
          </NavLink>
          <NavLink to="/orders" className={navClass}>
            <span>🛒</span> Orders
          </NavLink>
        </nav>
        <button
          onClick={handleLogout}
          className="m-3 px-4 py-2 text-sm text-indigo-200 hover:text-white hover:bg-indigo-700 rounded-lg transition-colors text-left"
        >
          ← Logout
        </button>
      </aside>
      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route
          path="/products"
          element={<PrivateRoute><Layout><Products /></Layout></PrivateRoute>}
        />
        <Route
          path="/customers"
          element={<PrivateRoute><Layout><Customers /></Layout></PrivateRoute>}
        />
        <Route
          path="/orders"
          element={<PrivateRoute><Layout><Orders /></Layout></PrivateRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}

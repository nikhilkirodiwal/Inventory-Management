import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ShopDetailView from "./pages/ShopDetailView";
import PartnerDetailView from "./pages/PartnerDetailView";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <Routes>
      {/* Login */}

      <Route
        path="/login"
        element={
          token ? (
            user?.role === "superadmin" ? (
              <Navigate to="/superadmin" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Login />
          )
        }
      />

      {/* Dashboard */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/superadmin"
        element={
          <ProtectedRoute>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/superadmin/shops/:id"
        element={
          <ProtectedRoute>
            <ShopDetailView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/superadmin/partners/:id"
        element={
          <ProtectedRoute>
            <PartnerDetailView />
          </ProtectedRoute>
        }
      />

      {/* Default */}

      <Route
        path="/"
        element={
          <Navigate
            to={
              token
                ? user?.role === "superadmin"
                  ? "/superadmin"
                  : "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />

      {/* 404 */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

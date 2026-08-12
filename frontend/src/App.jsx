import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ShopDetailView from "./pages/ShopDetailView";
import PartnerShopsView from "./pages/PartnerShopsView";
import PartnerShopDetailView from "./pages/PartnerShopDetailView";
import CrDetailPage from "./pages/CrDetailPage";

import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { token, user } = useAuth();

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

      {/* Personal Cr. / Patient Bill / Salary — full pages (were popups), each
          with their own back button to /dashboard */}

      <Route
        path="/dashboard/personal-cr"
        element={
          <ProtectedRoute>
            <CrDetailPage
              title="Personal Cr."
              fieldKey="personalCr"
              entriesKey="personalCrEntries"
              showCredited
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/patient-bill"
        element={
          <ProtectedRoute>
            <CrDetailPage
              title="Patient Bill (Official Cr.)"
              fieldKey="officialCr"
              entriesKey="officialCrEntries"
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/salary"
        element={
          <ProtectedRoute>
            <CrDetailPage
              title="Salary"
              fieldKey="salary"
              entriesKey="salaryEntries"
            />
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

      {/* Partner drill-down: partner -> sites (this month) -> day-wise per site */}

      <Route
        path="/superadmin/partners/:id"
        element={
          <ProtectedRoute>
            <PartnerShopsView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/superadmin/partners/:id/shops/:shopId"
        element={
          <ProtectedRoute>
            <PartnerShopDetailView />
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

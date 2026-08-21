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

      {/* Personal Cr. / Patient Bill / Salary / Purchase Credit — each a full
          page with its own back button to /dashboard. Mode determines the
          layout: personGrouped (Personal Cr.), dayCards (Patient Bill,
          Purchase Credit), or flatTable (Salary + Advance together). */}

      <Route
        path="/dashboard/personal-cr"
        element={
          <ProtectedRoute>
            <CrDetailPage
              title="Personal Cr."
              mode="personGrouped"
              fields={[
                {
                  key: "personalCr",
                  entriesKey: "personalCrEntries",
                  label: "Personal Cr.",
                  showCredited: true,
                },
              ]}
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
              mode="dayCards"
              fields={[
                {
                  key: "officialCr",
                  entriesKey: "officialCrEntries",
                  label: "Patient Bill",
                },
              ]}
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
              mode="flatTable"
              fields={[
                { key: "salary", entriesKey: "salaryEntries", label: "Salary" },
                {
                  key: "advance",
                  entriesKey: "advanceEntries",
                  label: "Advance",
                },
              ]}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/purchase-credit"
        element={
          <ProtectedRoute>
            <CrDetailPage
              title="Purchase Credit"
              mode="dayCards"
              fields={[
                {
                  key: "purchaseCredit",
                  entriesKey: "purchaseCreditEntries",
                  label: "Purchase Credit",
                },
              ]}
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

      {/* Partner drill-down: partner -> sites -> transactions per site */}

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

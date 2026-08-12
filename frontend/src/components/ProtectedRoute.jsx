import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token, logout, setAuthUser } = useAuth();

  const [status, setStatus] = useState(token ? "checking" : "unauthorized");

  useEffect(() => {
    if (!token) {
      setStatus("unauthorized");
      return;
    }

    let isMounted = true;

    const verifyToken = async () => {
      try {
        const { data } = await API.get("/auth/me");
        setAuthUser(data.user);
        if (isMounted) {
          setStatus("authorized");
        }
      } catch {
        logout();
        if (isMounted) {
          setStatus("unauthorized");
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]); // eslint-disable-line

  if (status === "checking") {
    return <div>Loading...</div>;
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

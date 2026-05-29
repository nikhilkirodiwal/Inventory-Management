import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../api/axios";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  const [status, setStatus] = useState(token ? "checking" : "unauthorized");

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    const verifyToken = async () => {
      try {
        const { data } = await API.get("/auth/me");

        localStorage.setItem("user", JSON.stringify(data.user));
        if (isMounted) {
          setStatus("authorized");
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (isMounted) {
          setStatus("unauthorized");
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (status === "checking") {
    return <div>Loading...</div>
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  return children;
}


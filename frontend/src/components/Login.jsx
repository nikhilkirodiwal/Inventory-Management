import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useTheme } from "../context/ThemeContext";

export default function Login() {
  useTheme();

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { data } = await API.post("/auth/login", formData);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Login successful");

      const redirectPath = data.user?.role === "superadmin" ? "/superadmin" : "/dashboard";
      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Login to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border px-4 py-3 pr-12 outline-none"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <LogIn size={18} />
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="text-sm text-muted-foreground mt-4">
          Admin Credentials :- super@admin.com / superadmin123
        </div>
        <div className="text-sm text-muted-foreground mt-4">
          Shop Credentials :- demo@gmail.com / demo123
        </div>
      </div>
    </div>
  );
}
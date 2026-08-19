import { useState, useContext } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client";
import { AuthContext } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import { subscribeToPushNotifications } from "../utils/pushHelper";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================
  // GOOGLE LOGIN
  // ==========================================
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.post(
          "/api/users/google",
          {
            token: tokenResponse.access_token,
          }
        );

        // Save logged-in user first
        login(response.data);

        // Register push notifications
        // Works for both Web and Android
        subscribeToPushNotifications(response.data.token);

        const redirectTo = location.state?.from || "/";
        navigate(redirectTo);

      } catch (err) {
        console.error("Google Sign-In failed:", err);

        setError("Google Sign-In failed. Please try again.");
        setLoading(false);
      }
    },

    onError: (error) => {
      console.log("Google Auth Error:", error);

      setError("Google Sign-In was cancelled or failed.");
      setLoading(false);
    },
  });

  // ==========================================
  // EMAIL / PASSWORD LOGIN
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post(
        "/api/users/login",
        {
          email,
          password,
        }
      );

      // Save logged-in user first
      login(response.data);

      // Register push notifications
      // Do not await this because login should
      // not be blocked by notification registration
      subscribeToPushNotifications(response.data.token);

      const redirectTo = location.state?.from || "/";
      navigate(redirectTo);

    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err.response?.data?.message ||
        "Failed to log in. Check your credentials."
      );

      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-full px-4 py-12">
      <div className="bg-moboxd-card w-full max-w-md p-10 rounded-3xl border border-[#2A2A35] shadow-2xl">

        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-[#1A1A21] border border-[#2A2A35] rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <i className="bi bi-star-fill text-moboxd-accent text-3xl"></i>
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome Back
          </h2>

          <p className="text-moboxd-muted mt-2 font-medium">
            Log in to share and review moments.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl text-sm mb-8 text-center font-medium">
            {error}
          </div>
        )}

        {/* EMAIL LOGIN */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
        >
          <div>
            <label className="text-xs font-bold text-moboxd-muted mb-2 block uppercase tracking-wider">
              Email Address
            </label>

            <input
              type="email"
              className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-4 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent focus:ring-1 focus:ring-moboxd-accent transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-moboxd-muted block uppercase tracking-wider">
                Password
              </label>

              <a
                href="#"
                className="text-xs font-bold text-moboxd-accent hover:underline"
              >
                Forgot?
              </a>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-4 pr-12 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent focus:ring-1 focus:ring-moboxd-accent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-moboxd-muted hover:text-black transition-colors cursor-pointer"
              >
                <i
                  className={`bi ${
                    showPassword
                      ? "bi-eye-slash"
                      : "bi-eye"
                  } text-xl`}
                ></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-moboxd-accent hover:bg-yellow-400 text-black font-extrabold text-lg py-4 rounded-xl transition-all active:scale-[0.98] mt-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-moboxd-accent/20"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-[#2A2A35] flex-1"></div>

          <span className="text-xs text-moboxd-muted uppercase tracking-widest font-bold">
            Or
          </span>

          <div className="h-px bg-[#2A2A35] flex-1"></div>
        </div>

        {/* GOOGLE LOGIN */}
        <button
          type="button"
          onClick={() => googleLogin()}
          disabled={loading}
          className="w-full bg-[#1A1A21] border border-[#2A2A35] hover:bg-[#2A2A35] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98] disabled:opacity-50"
        >
          <i className="bi bi-google text-lg text-white"></i>

          Continue with Google
        </button>

        {/* REGISTER */}
        <div className="mt-8 text-center pt-2">
          <p className="text-moboxd-muted font-medium">
            Don't have an account?{" "}

            <Link
              to="/register"
              className="text-white font-bold hover:text-moboxd-accent transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
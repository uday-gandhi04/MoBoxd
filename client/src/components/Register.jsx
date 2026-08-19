import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import { Capacitor } from "@capacitor/core";
import { nativeGoogleLogin } from "../utils/googleAuth";
import { subscribeToPushNotifications } from "../utils/pushHelper";

const Register = () => {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        
        // Send the access_token directly to our backend
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/google`, {
           token: tokenResponse.access_token 
        });
        
        login(response.data);
        navigate('/');
      } catch (err) {
        setError('Google Sign-In failed. Please try again.');
        setLoading(false);
      }
    },
    onError: (error) => {
      console.log('Google Auth Error:', error);
      setError('Google Sign-In was cancelled or failed.');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/register`,
        {
          displayName,
          username,
          email,
          password,
        },
      );

      login(response.data);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Try a different username/email.",
      );
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
  try {
    setLoading(true);
    setError("");

    // ==========================================
    // NATIVE ANDROID / IOS
    // ==========================================
    if (Capacitor.isNativePlatform()) {
      const googleResult =
        await nativeGoogleLogin();

      const idToken =
        googleResult?.result?.idToken;

      if (!idToken) {
        throw new Error(
          "Google did not return an ID token"
        );
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/google`,
        {
          idToken,
        }
      );

      login(response.data);

      subscribeToPushNotifications(
        response.data.token
      );

      navigate("/");

      return;
    }

    // ==========================================
    // WEB
    // ==========================================
    googleLogin();

  } catch (error) {
    console.error(
      "Google signup failed:",
      error
    );

    setError(
      error.response?.data?.message ||
      "Google Sign-In failed. Please try again."
    );

    setLoading(false);
  }
};

  return (
    <div className="flex items-center justify-center min-h-full px-4 py-12">
      <div className="bg-moboxd-card w-full max-w-xl p-10 rounded-3xl border border-[#2A2A35] shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-[#1A1A21] border border-[#2A2A35] rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <i className="bi bi-star-fill text-moboxd-accent text-3xl"></i>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Join MoBoxd
          </h2>
          <p className="text-moboxd-muted mt-2 font-medium">
            Create an account to start reviewing.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl text-sm mb-8 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Row 1: Display Name and Username */}
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1">
              <label className="text-xs font-bold text-moboxd-muted mb-2 block uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-4 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent focus:ring-1 focus:ring-moboxd-accent transition-all"
                placeholder="Uday Gandhi"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="flex-1">
              <label className="text-xs font-bold text-moboxd-muted mb-2 block uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-4 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent focus:ring-1 focus:ring-moboxd-accent transition-all"
                placeholder="uday.dev"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row 2: Email */}
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

          {/* Row 3: Passwords */}
          <div className="flex flex-col sm:flex-row gap-5">
            <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-moboxd-muted block uppercase tracking-wider">
                Password
              </label>
            </div>
            {/* Added relative wrapper for positioning */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} 
                className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-4 pr-12 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent focus:ring-1 focus:ring-moboxd-accent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* Added the toggle button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-moboxd-muted hover:text-black transition-colors cursor-pointer"
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-xl`}></i>
              </button>
            </div>
          </div>

            <div className="flex-1">
              <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-moboxd-muted block uppercase tracking-wider">
                Confirm Password
              </label>
            </div>
            {/* Added relative wrapper for positioning */}
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"} 
                className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-4 pr-12 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent focus:ring-1 focus:ring-moboxd-accent transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {/* Added the toggle button */}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-moboxd-muted hover:text-black transition-colors cursor-pointer"
              >
                <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'} text-xl`}></i>
              </button>
            </div>
          </div>
          </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-moboxd-accent hover:bg-yellow-400 text-black font-extrabold text-lg py-4 rounded-xl transition-all active:scale-[0.98] mt-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-moboxd-accent/20"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-[#2A2A35] flex-1"></div>
          <span className="text-xs text-moboxd-muted uppercase tracking-widest font-bold">
            Or
          </span>
          <div className="h-px bg-[#2A2A35] flex-1"></div>
        </div>

        <button
          type="button" // Important: change to type="button" so it doesn't submit the form
          onClick={handleGoogleSignup}
          className="w-full bg-[#1A1A21] border border-[#2A2A35] hover:bg-[#2A2A35] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98]"
        >
          <i className="bi bi-google text-lg text-white"></i>
          Sign up with Google
        </button>

        <div className="mt-8 text-center pt-2">
          <p className="text-moboxd-muted font-medium">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-white font-bold hover:text-moboxd-accent transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        const response = await axios.post('http://localhost:5000/api/users/google', {
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
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/login",
        {
          email,
          password,
        },
      );

      login(response.data);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to log in. Check your credentials.",
      );
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    alert("Google Sign-In logic to be implemented on the backend!");
  };

  return (
    // min-h-full with py-12 gives the card perfect vertical breathing room on all screen sizes
    <div className="flex items-center justify-center min-h-full px-4 py-12">
      {/* Increased padding (p-10) and softer corners (rounded-3xl) for a premium app feel */}
      <div className="bg-moboxd-card w-full max-w-md p-10 rounded-3xl border border-[#2A2A35] shadow-2xl">
        <div className="text-center mb-10">
          {/* Framed icon container */}
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="text-xs font-bold text-moboxd-muted mb-2 block uppercase tracking-wider">
              Email Address
            </label>
            {/* Taller inputs (p-4) with focus rings */}
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
              {/* Added a realistic utility link to balance the label spacing */}
              <a
                href="#"
                className="text-xs font-bold text-moboxd-accent hover:underline"
              >
                Forgot?
              </a>
            </div>
            <input
              type="password"
              className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-4 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent focus:ring-1 focus:ring-moboxd-accent transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            // active:scale-[0.98] adds a satisfying "press" animation when clicked
            className="w-full bg-moboxd-accent hover:bg-yellow-400 text-black font-extrabold text-lg py-4 rounded-xl transition-all active:scale-[0.98] mt-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-moboxd-accent/20"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-[#2A2A35] flex-1"></div>
          <span className="text-xs text-moboxd-muted uppercase tracking-widest font-bold">
            Or
          </span>
          <div className="h-px bg-[#2A2A35] flex-1"></div>
        </div>

        {/* Dark-mode adapted Google Auth Button */}
        <button
          type="button" // Important: change to type="button" so it doesn't submit the form
          onClick={() => googleLogin()}
          className="w-full bg-[#1A1A21] border border-[#2A2A35] hover:bg-[#2A2A35] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98]"
        >
          <i className="bi bi-google text-lg text-white"></i>
          Sign up with Google
        </button>

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

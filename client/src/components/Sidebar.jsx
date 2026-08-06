import { useContext, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const Sidebar = ({ onOpenCreateModal }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [hasUnreadActivity, setHasUnreadActivity] = useState(false);

  // Fetch dynamic categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/posts/categories`,
        );
        setCategories(res.data);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    // 1. If we are currently on the activity page, force the dot off and skip the API call!
    if (location.pathname === '/activity') {
      setHasUnreadActivity(false);
      return;
    }

    // 2. Otherwise, check the backend normally
    const checkUnreadActivity = async () => {
      if (!user) return;
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/activity/unread`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setHasUnreadActivity(data.hasUnread || data.count > 0);
      } catch (error) {
        console.error("Failed to fetch unread activity status", error);
      }
    };

    checkUnreadActivity();
  }, [user, location.pathname]);

  // Helper function to check if a link is active
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="hidden md:flex w-64 h-screen border-r border-[#2A2A35] bg-moboxd-bg flex flex-col justify-between py-6 px-4 sticky top-0 overflow-y-auto custom-scrollbar">
      {/* Top Section: Logo & Nav Links */}
      <div>
        <Link
          to="/"
          className="flex items-center gap-2 mb-10 px-2 text-decoration-none"
        >
          <i className="bi bi-star-fill text-moboxd-accent text-2xl"></i>
          <span className="text-2xl font-bold text-white tracking-wide">
            MoBoxd
          </span>
        </Link>

        <nav className="flex flex-col gap-2 mb-8">
          <Link
            to="/"
            className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-colors ${isActive("/") ? "bg-moboxd-card text-moboxd-accent" : "text-moboxd-muted hover:text-white hover:bg-[#1A1A21]"}`}
          >
            <i className="bi bi-house-door text-lg"></i>
            Home
          </Link>
          <Link
            to="/explore"
            className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-colors ${isActive("/explore") ? "bg-moboxd-card text-moboxd-accent" : "text-moboxd-muted hover:text-white hover:bg-[#1A1A21]"}`}
          >
            <i className="bi bi-compass text-lg"></i>
            Explore
          </Link>
          <Link
            to="/rankings/new"
            className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-colors ${isActive("/rankings/new") ? "bg-moboxd-card text-moboxd-accent" : "text-moboxd-muted hover:text-white hover:bg-[#2A2A35]"}`}
          >
            <i className="bi bi-list-ol text-xl"></i>
            <span className="font-bold tracking-wide">New Ranking</span>
          </Link>
          <Link
            to="/rankings"
            className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-colors ${isActive("/rankings") ? "bg-moboxd-card text-moboxd-accent" : "text-moboxd-muted hover:text-white hover:bg-[#2A2A35]"}`}
          >
            <i className="bi bi-trophy text-xl"></i>
            <span className="font-bold tracking-wide">Rankings</span>
          </Link>

          <Link
            to="/activity"
            className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-colors ${
              isActive("/activity")
                ? "bg-moboxd-card text-moboxd-accent"
                : "text-moboxd-muted hover:text-white hover:bg-[#2A2A35]"
            }`}
            onClick={() => setHasUnreadActivity(false)}
          >
            {/* WRAPPER FOR ICON AND DOT */}
            <div className="relative flex items-center justify-center">
              <i className="bi bi-bell text-xl"></i>

              {/* THE RED DOT */}
              {hasUnreadActivity && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1A1A21] animate-pulse"></span>
              )}
            </div>

            <span className="font-bold tracking-wide">Activity</span>
          </Link>
          {user && (
            <Link
              to={`/profile/${user.username}?tab=saved`}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-colors ${
                location.pathname === `/profile/${user.username}` &&
                location.search === "?tab=saved"
                  ? "bg-moboxd-card text-moboxd-accent"
                  : "text-moboxd-muted hover:text-white hover:bg-[#2A2A35]"
              }`}
            >
              <i className="bi bi-bookmark text-lg"></i>
              Bookmarks
            </Link>
          )}
          {user && (
            <Link
              to={`/profile/${user.username}`}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-colors ${
                location.pathname === `/profile/${user.username}` &&
                location.search !== "?tab=saved"
                  ? "bg-moboxd-card text-moboxd-accent"
                  : "text-moboxd-muted hover:text-white hover:bg-[#1A1A21]"
              }`}
            >
              <i className="bi bi-person text-lg"></i>
              Profile
            </Link>
          )}
        </nav>

        {/* Create Button */}
        <button
          onClick={onOpenCreateModal}
          className="w-full bg-moboxd-accent hover:bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors mb-10"
        >
          <i className="bi bi-plus-lg"></i>
          New Moment
        </button>

        {/* Categories Section (Dynamic) */}
        <div>
          <h3 className="text-xs font-bold text-moboxd-muted tracking-widest uppercase px-4 mb-4">
            Categories
          </h3>
          <div className="flex flex-col gap-1">
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.map((cat, index) => (
                <Link
                  key={index}
                  to={`/category/${cat}`}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors text-left capitalize ${isActive(`/category/${cat}`) ? "bg-[#2A2A35] text-white" : "text-moboxd-muted hover:text-white hover:bg-[#1A1A21]"}`}
                >
                  <i className="bi bi-hash text-lg"></i>
                  {cat}
                </Link>
              ))
            ) : (
              <span className="px-4 text-sm text-moboxd-muted">
                No categories yet
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: User Profile Mini / Login */}
      <div className="mt-auto pt-6">
        {user ? (
          <div className="flex items-center justify-between px-2">
            <Link
              to={`/profile/${user.username}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-[#2A2A35] flex items-center justify-center overflow-hidden">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <i className="bi bi-person-fill text-moboxd-muted"></i>
                )}
              </div>
              <div className="flex flex-col">
                {/* SHOW DISPLAY NAME HERE */}
                <span className="text-sm font-bold text-white leading-tight">
                  {user.displayName || user.username}
                </span>
                <span className="text-xs text-moboxd-muted">
                  @{user.username.toLowerCase()}
                </span>
              </div>
            </Link>
            <button
              onClick={logout}
              className="text-moboxd-muted hover:text-red-400 transition-colors"
              title="Logout"
            >
              <i className="bi bi-box-arrow-right text-lg"></i>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              to="/login"
              className="text-center w-full bg-[#1A1A21] hover:bg-[#2A2A35] text-white font-bold py-2 rounded-xl transition-colors"
            >
              Log In
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

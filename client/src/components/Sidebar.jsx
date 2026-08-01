import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Sidebar = ({ onOpenCreateModal }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  // Helper function to check if a link is active
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 h-screen border-r border-[#2A2A35] bg-moboxd-bg flex flex-col justify-between py-6 px-4 sticky top-0 overflow-y-auto custom-scrollbar">
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
            to="/activity"
            className="flex items-center gap-4 px-4 py-3 text-moboxd-muted hover:text-white hover:bg-[#2A2A35] rounded-xl transition-all"
          >
            <i className="bi bi-bell text-xl"></i>{" "}
            {/* Or bi-activity, depending on your icon */}
            <span className="font-bold tracking-wide">Activity</span>
          </Link>
          <Link
            to="#"
            className="flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-moboxd-muted hover:text-white hover:bg-[#1A1A21] transition-colors cursor-not-allowed opacity-50"
          >
            <i className="bi bi-bookmark text-lg"></i>
            Bookmarks
          </Link>
          {user && (
            <Link
              to={`/profile/${user.username}`}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-colors ${isActive(`/profile/${user.username}`) ? "bg-moboxd-card text-moboxd-accent" : "text-moboxd-muted hover:text-white hover:bg-[#1A1A21]"}`}
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

        {/* Categories Section */}
        <div>
          <h3 className="text-xs font-bold text-moboxd-muted tracking-widest uppercase px-4 mb-4">
            Categories
          </h3>
          <div className="flex flex-col gap-1">
            {["Food", "Places", "Music", "Entertainment", "Other"].map(
              (cat) => (
                <button
                  key={cat}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-moboxd-muted hover:text-white transition-colors text-left"
                >
                  <i
                    className={`bi bi-${cat === "Food" ? "cup-hot" : cat === "Places" ? "geo-alt" : cat === "Music" ? "music-note" : cat === "Entertainment" ? "film" : "box"}`}
                  ></i>
                  {cat}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: User Profile Mini / Login */}
      <div className="mt-auto">
        {user ? (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
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
                <span className="text-sm font-bold text-white leading-tight">
                  {user.username}
                </span>
                <span className="text-xs text-moboxd-muted">
                  @{user.username.toLowerCase()}
                </span>
              </div>
            </div>
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

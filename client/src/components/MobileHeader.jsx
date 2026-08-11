import { useState, useContext, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const MobileHeader = () => {
  const { user, setUser } = useContext(AuthContext);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasUnreadActivity, setHasUnreadActivity] = useState(false);
  const hideOnRoutes = ["/login", "/signup"];
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    "Notification" in window && Notification.permission === "granted"
  );

  const location = useLocation();
  const navigate = useNavigate();

  const isMyProfile = user && location.pathname === `/profile/${user.username}`;

  // 1. Fetch unread activity status
  useEffect(() => {
    // 1. If we are currently on the activity page, force the dot off and skip the API call!
    if (location.pathname === "/activity") {
      setHasUnreadActivity(false);
      return;
    }

    // 2. Otherwise, check the backend normally
    const checkUnreadActivity = async () => {
      if (!user) return;
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/activity/unread`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          },
        );
        setHasUnreadActivity(data.hasUnread || data.count > 0);
      } catch (error) {
        console.error("Failed to fetch unread activity status", error);
      }
    };

    checkUnreadActivity();
  }, [user, location.pathname]);

  const handleLogout = () => {
    if (typeof setUser === "function") {
      setUser(null); // This instantly clears the React state
    }
    localStorage.removeItem("user"); // This clears the browser memory
    setIsSettingsOpen(false);
    navigate("/login");
  };

  

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      // Browsers do not let websites programmatically "revoke" permission easily.
      // If they want to turn it off, they have to do it in browser settings.
      alert("To disable notifications, please click the lock icon in your browser URL bar and block notifications.");
    } else {
      // Trigger the prompt (not silent, so they get the success alert)
      const success = await subscribeToPushNotifications(user.token, false);
      if (success) {
        setNotificationsEnabled(true);
      }
    }
  };

  // If the current URL matches one of those routes, return null (render nothing)
  if (hideOnRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 w-full bg-[#1A1A21] border-b border-[#2A2A35] flex justify-between items-center h-16 px-4 z-50">
        <Link to="/" className="flex items-center gap-2">
          <i className="bi bi-star-fill text-moboxd-accent text-2xl"></i>
          <span className="text-xl font-bold text-white tracking-wide">
            MoBoxd
          </span>
        </Link>

        {user &&
          (isMyProfile ? (
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`text-white hover:text-moboxd-accent transition-colors flex items-center text-2xl ${isSettingsOpen ? "text-moboxd-accent" : ""}`}
            >
              <i className="bi bi-gear-fill"></i>
            </button>
          ) : (
            // --- UPDATED BELL ICON WITH RED DOT ---
            <Link
              to="/activity"
              className="relative text-white hover:text-moboxd-accent transition-colors flex items-center text-2xl"
              onClick={() => setHasUnreadActivity(false)} // Optimistically clear the dot when clicked
            >
              <i className="bi bi-bell-fill"></i>

              {/* THE RED DOT */}
              {hasUnreadActivity && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1A1A21] animate-pulse"></span>
              )}
            </Link>
          ))}
      </header>

      {/* Settings Dropdown Menu */}
      {isSettingsOpen && isMyProfile && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsSettingsOpen(false)}
          ></div>

          <div className="md:hidden fixed top-16 right-0 w-full sm:w-64 bg-[#1A1A21] border-b sm:border border-[#2A2A35] shadow-2xl z-40 flex flex-col py-2 px-4 sm:mr-4 sm:mt-2 sm:rounded-xl">
            
            {/* Notifications Toggle Button */}
            <button
              onClick={handleToggleNotifications}
              className="py-3 text-base font-bold text-white hover:bg-[#2A2A35] rounded-lg flex items-center justify-between gap-3 w-full text-left transition-colors px-2 border-b border-[#2A2A35] mb-1"
            >
              <div className="flex items-center gap-3">
                <i className={`bi ${notificationsEnabled ? 'bi-bell-fill text-moboxd-accent' : 'bi-bell-slash text-moboxd-muted'} text-xl`}></i> 
                Notifications
              </div>
              
              {/* Fake Toggle Switch UI */}
              <div className={`w-10 h-5 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-moboxd-accent' : 'bg-gray-600'}`}>
                <div className={`w-4 h-4 bg-black rounded-full absolute top-0.5 transition-all ${notificationsEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
              </div>
            </button>
            
            {/*logout button*/}
            <button
              onClick={handleLogout}
              className="py-3 text-base font-bold text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-3 w-full text-left transition-colors px-2"
            >
              <i className="bi bi-box-arrow-right text-xl"></i> Log Out
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default MobileHeader;

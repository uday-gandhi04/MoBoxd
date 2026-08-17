import { useState, useContext, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { subscribeToPushNotifications } from "../utils/pushHelper";
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const MobileHeader = () => {
  const { user, setUser } = useContext(AuthContext);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasUnreadActivity, setHasUnreadActivity] = useState(false);
  const hideOnRoutes = ["/login", "/signup"];
  
  // Default to web status, but we will check native status below
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    "Notification" in window && Notification.permission === "granted"
  );

  const location = useLocation();
  const navigate = useNavigate();

  const isMyProfile = user && location.pathname === `/profile/${user.username}`;

  // 1. Fetch unread activity status
  useEffect(() => {
    if (location.pathname === "/activity") {
      setHasUnreadActivity(false);
      return;
    }

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

  // 2. Check Native Notification Permission Status on Mount
  useEffect(() => {
    const checkNativePermissions = async () => {
      if (Capacitor.isNativePlatform()) {
        const permStatus = await PushNotifications.checkPermissions();
        setNotificationsEnabled(permStatus.receive === 'granted');
      }
    };
    checkNativePermissions();
  }, []);

  const handleLogout = () => {
    if (typeof setUser === "function") {
      setUser(null); 
    }
    localStorage.removeItem("user"); 
    setIsSettingsOpen(false);
    navigate("/login");
  };

  // 3. Hybrid Toggle Logic
  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      // --- TURN OFF ---
      if (Capacitor.isNativePlatform()) {
        try {
          // Tell backend to remove token for this device
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/notifications/unsubscribe`,
            { platform: Capacitor.getPlatform() }, 
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          setNotificationsEnabled(false);
          alert('Notifications paused in MoBoxd. To block them entirely, manage permissions in your Android App Settings.');
        } catch (error) {
          console.error("Failed to unsubscribe", error);
        }
      } else {
        // Web fallback
        alert("To disable notifications, please click the lock icon in your browser URL bar and block notifications.");
      }
    } else {
      // --- TURN ON ---
      if (Capacitor.isNativePlatform()) {
        const permStatus = await PushNotifications.requestPermissions();
        if (permStatus.receive === 'granted') {
          // Triggers the App.jsx listener to save the new token
          await PushNotifications.register();
          setNotificationsEnabled(true);
        } else {
          alert('Permission denied. Please enable notifications for MoBoxd in your phone Settings.');
        }
      } else {
        // Web fallback
        const success = await subscribeToPushNotifications(user.token, false);
        if (success) {
          setNotificationsEnabled(true);
        }
      }
    }
  };

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
            <Link
              to="/activity"
              className="relative text-white hover:text-moboxd-accent transition-colors flex items-center text-2xl"
              onClick={() => setHasUnreadActivity(false)} 
            >
              <i className="bi bi-bell-fill"></i>

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
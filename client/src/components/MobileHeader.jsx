import { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const MobileHeader = () => {
  const { user, dispatch } = useContext(AuthContext); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Check if the user is viewing their OWN profile
  const isMyProfile = user && location.pathname === `/profile/${user.username}`;

  const handleLogout = () => {
    if (dispatch) dispatch({ type: "LOGOUT" });
    localStorage.removeItem("user");
    setIsSettingsOpen(false);
    navigate("/login");
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="md:hidden fixed top-0 left-0 w-full bg-[#1A1A21] border-b border-[#2A2A35] flex justify-between items-center h-16 px-4 z-50">
        <Link to="/" className="flex items-center gap-2">
          <i className="bi bi-star-fill text-moboxd-accent text-2xl"></i>
          <span className="text-xl font-bold text-white tracking-wide">MoBoxd</span>
        </Link>

        {/* Contextual Top-Right Button */}
        {user && (
          isMyProfile ? (
            // Show GEAR icon if on own profile
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
              className={`text-white hover:text-moboxd-accent transition-colors flex items-center text-2xl ${isSettingsOpen ? 'text-moboxd-accent' : ''}`}
            >
              <i className="bi bi-gear-fill"></i>
            </button>
          ) : (
            // Show BELL icon everywhere else
            <Link 
              to="/activity" 
              className="text-white hover:text-moboxd-accent transition-colors flex items-center text-2xl"
            >
              <i className="bi bi-bell-fill"></i>
            </Link>
          )
        )}
      </header>

      {/* Settings Dropdown Menu (Only visible when Gear is clicked) */}
      {isSettingsOpen && isMyProfile && (
        <>
          {/* Invisible overlay to close menu when clicking outside */}
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsSettingsOpen(false)}
          ></div>
          
          <div className="md:hidden fixed top-16 right-0 w-full sm:w-64 bg-[#1A1A21] border-b sm:border border-[#2A2A35] shadow-2xl z-40 flex flex-col py-2 px-4 sm:mr-4 sm:mt-2 sm:rounded-xl">
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
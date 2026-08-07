import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const BottomNav = ({ onOpenCreateModal }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const hideOnRoutes = ["/login", "/signup"];

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  if (hideOnRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#1A1A21] border-t border-[#2A2A35] flex justify-between items-center h-16 z-50 px-4 pb-safe">
      
      {/* 1. Home */}
      <Link to="/" className={`flex flex-col items-center justify-center h-full ${isActive('/') ? 'text-moboxd-accent' : 'text-moboxd-muted hover:text-white'}`}>
        <i className={`text-2xl bi ${isActive('/') ? 'bi-house-fill' : 'bi-house'}`}></i>
      </Link>
      
      {/* 2. Explore */}
      <Link to="/explore" className={`flex flex-col items-center justify-center h-full ${isActive('/explore') ? 'text-moboxd-accent' : 'text-moboxd-muted hover:text-white'}`}>
        <i className={`text-2xl bi ${isActive('/explore') ? 'bi-compass-fill' : 'bi-compass'}`}></i>
      </Link>

      {/* 3. New Moment (Triggers Modal, No URL routing!) */}
      <button 
        onClick={onOpenCreateModal} 
        className="flex flex-col items-center justify-center h-full focus:outline-none"
      >
        <div className="bg-moboxd-accent text-black w-10 h-10 rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg transition-transform active:scale-95">
          <i className="bi bi-plus-lg"></i>
        </div>
      </button>

      {/* 4. Rankings (Added) */}
      <Link to="/rankings" className={`flex flex-col items-center justify-center h-full ${isActive('/rankings') ? 'text-moboxd-accent' : 'text-moboxd-muted hover:text-white'}`}>
        <i className={`text-2xl bi ${isActive('/rankings') ? 'bi-trophy-fill' : 'bi-trophy'}`}></i>
      </Link>

      {/* 5. Profile */}
      <Link to={`/profile/${user.username}`} className={`flex flex-col items-center justify-center h-full ${location.pathname === `/profile/${user.username}` ? 'text-moboxd-accent' : 'text-moboxd-muted hover:text-white'}`}>
        {user.profilePicture ? (
           <div className={`w-7 h-7 rounded-full overflow-hidden border-2 ${location.pathname === `/profile/${user.username}` ? 'border-moboxd-accent' : 'border-transparent'}`}>
             <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
           </div>
        ) : (
          <i className={`text-2xl bi ${location.pathname === `/profile/${user.username}` ? 'bi-person-fill' : 'bi-person'}`}></i>
        )}
      </Link>

    </nav>
  );
};

export default BottomNav;
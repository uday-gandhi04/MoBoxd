import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const MobileHeader = () => {
  const { user, dispatch } = useContext(AuthContext); // Assuming you use dispatch to logout, or adjust to your logout function
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (dispatch) dispatch({ type: "LOGOUT" });
    localStorage.removeItem("user");
    setIsMenuOpen(false);
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

        {user && (
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="text-white focus:outline-none text-2xl"
          >
            <i className={`bi ${isMenuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>
        )}
      </header>

      {/* Hamburger Dropdown Menu */}
      {user && isMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full h-[calc(100vh-4rem)] bg-black/80 backdrop-blur-md z-40">
          <div className="bg-[#1A1A21] border-b border-[#2A2A35] flex flex-col px-4 py-6 shadow-2xl">
            <Link to="/create-ranking" onClick={() => setIsMenuOpen(false)} className="py-3 text-lg font-bold text-white flex items-center gap-4">
              <i className="bi bi-list-ol text-moboxd-muted"></i> New Ranking
            </Link>
            <Link to="/rankings" onClick={() => setIsMenuOpen(false)} className="py-3 text-lg font-bold text-white flex items-center gap-4">
              <i className="bi bi-trophy text-moboxd-muted"></i> Rankings
            </Link>
            <Link to="/activity" onClick={() => setIsMenuOpen(false)} className="py-3 text-lg font-bold text-white flex items-center gap-4">
              <i className="bi bi-bell text-moboxd-muted"></i> Activity
            </Link>
            <Link to={`/profile/${user.username}?tab=saved`} onClick={() => setIsMenuOpen(false)} className="py-3 text-lg font-bold text-white flex items-center gap-4 border-b border-[#2A2A35] mb-2 pb-5">
              <i className="bi bi-bookmark text-moboxd-muted"></i> Bookmarks
            </Link>
            
            <button onClick={handleLogout} className="py-3 text-lg font-bold text-red-500 flex items-center gap-4 text-left">
              <i className="bi bi-box-arrow-right"></i> Log Out
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileHeader;
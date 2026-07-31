import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-dark bg-black border-bottom border-secondary sticky-top">
      <div className="container d-flex justify-content-between align-items-center">
        <Link to="/" className="navbar-brand mb-0 h1 fs-3 fw-bold tracking-wide text-decoration-none text-warning">
          MoBoxd
        </Link>
        
        <div>
          {user ? (
            <div className="d-flex align-items-center gap-3">
              <Link to="/explore" className="text-light text-decoration-none d-none d-sm-inline">
                <i className="bi bi-compass"></i> Explore
              </Link>
              
              <Link to="/create" className="btn btn-warning btn-sm fw-bold text-dark">
                <i className="bi bi-plus-lg me-1"></i> New Post
              </Link>
              
              <Link to={`/profile/${user.username}`} className="text-light text-decoration-none d-none d-sm-inline">
                Hi, {user.username}
              </Link>
              
              <button onClick={handleLogout} className="btn btn-outline-light btn-sm">Logout</button>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-3">
              <Link to="/explore" className="text-light text-decoration-none d-none d-sm-inline">
                <i className="bi bi-compass"></i> Explore
              </Link>
              <Link to="/login" className="btn btn-outline-light btn-sm">Login</Link>
              <Link to="/register" className="btn btn-light btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
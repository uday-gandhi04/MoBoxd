import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Feed from './components/Feed';
import Login from './components/Login';
import Register from './components/Register';
import CreatePost from './components/CreatePost';
import PostDetail from './components/PostDetail';
import Profile from './components/Profile';

function App() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-dark min-vh-100" style={{ backgroundColor: '#121212' }}>
      <nav className="navbar navbar-dark bg-black border-bottom border-secondary sticky-top">
        <div className="container d-flex justify-content-between">
          <Link to="/" className="navbar-brand mb-0 h1 fs-3 fw-bold tracking-wide text-decoration-none">
            MoBoxd
          </Link>
          
          <div>
            {user ? (
              <div className="d-flex align-items-center gap-3">
                {/* Add the Create Post Link */}
                <Link to="/create" className="btn btn-warning btn-sm fw-bold text-dark">
                  <i className="bi bi-plus-lg me-1"></i> New Post
                </Link>
                
                <span className="text-light d-none d-sm-inline">Hi, {user.username}</span>
                <button onClick={handleLogout} className="btn btn-outline-light btn-sm">Logout</button>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-light btn-sm">Login</Link>
                <Link to="/register" className="btn btn-light btn-sm">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/profile/:username" element={<Profile />} />
      </Routes>
    </div>
  );
}

export default App;
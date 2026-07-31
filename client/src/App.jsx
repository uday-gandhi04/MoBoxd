import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Feed from './components/Feed';
import Login from './components/Login';
import Register from './components/Register';
import CreatePost from './components/CreatePost';
import PostDetail from './components/PostDetail';
import Profile from './components/Profile';
import Explore from './components/Explore';

function App() {
  return (
    <div className="bg-dark min-vh-100" style={{ backgroundColor: '#121212' }}>
      {/* The Navbar component handles its own state and logic */}
      <Navbar />

      {/* The Router handles page navigation */}
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/explore" element={<Explore />} />
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
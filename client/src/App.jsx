import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import Login from './components/Login';
import Register from './components/Register';
import PostDetail from './components/PostDetail';
import Profile from './components/Profile';
import Explore from './components/Explore';
import CreatePostModal from './components/CreatePostModal'; 
import Activity from './components/Activity'; 
import CreateRanking from './components/CreateRanking'; 
import RankingArena from './components/RankingArena'; 
import RankingsFeed from './components/RankingsFeed';

function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-moboxd-bg text-moboxd-text overflow-hidden font-sans">
      
      {/* Pass the open function to the Sidebar */}
      <Sidebar onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/activity" element={<Activity />} /> 
          <Route path="/rankings/new" element={<CreateRanking />} />
          <Route path="/rankings/:id" element={<RankingArena />} />
          <Route path="/rankings" element={<RankingsFeed />} />
        </Routes>
      </main>

      {/* Render the Modal at the root level */}
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onPostCreated={() => {
          // A quick page reload ensures the feed grabs the newest post immediately
          window.location.reload(); 
        }}
      />

    </div>
  );
}

export default App;
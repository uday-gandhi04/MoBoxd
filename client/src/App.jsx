import { useState, useEffect, useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import BottomNav from './components/BottomNav';
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
import CategoryFeed from './components/CategoryFeed';

import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import axios from 'axios';
import { AuthContext } from './context/AuthContext';

function NativeWrapper({ children }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // 1. Hardware Back Button (Android)
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) navigate(-1);
      else CapApp.exitApp();
    });

    // 2. Universal Deep Links
    const appUrlListener = CapApp.addListener('appUrlOpen', (data) => {
      const path = data.url.split('.com').pop(); 
      if (path) navigate(path);
    });

    // 3. Native Push Notification Handlers
    const pushTokenListener = PushNotifications.addListener('registration', (token) => {
      if (user?.token) {
        axios.post(
          `${import.meta.env.VITE_API_URL}/api/notifications/subscribe`,
          { token: token.value, platform: Capacitor.getPlatform() },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
      }
    });

    const pushTapListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        const url = notification.notification.data.url;
        if (url) navigate(url);
      }
    );

    return () => {
      backListener.remove();
      appUrlListener.remove();
      pushTokenListener.remove();
      pushTapListener.remove();
    };
  }, [navigate, user]);

  return <>{children}</>;
}

function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <NativeWrapper>
      <div className="flex h-screen bg-moboxd-bg text-moboxd-text overflow-hidden font-sans">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <MobileHeader />

        {/* Desktop Sidebar */}
        <Sidebar onOpenCreateModal={() => setIsCreateModalOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pt-16 pb-20 md:pt-0 md:pb-0 w-full relative">
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
            <Route path="/category/:categoryName" element={<CategoryFeed />} />
          </Routes>
        </main>

        {/* Mobile Bottom Nav (Hidden on Desktop) */}
        <BottomNav onOpenCreateModal={() => setIsCreateModalOpen(true)} />

        {/* Render the Modal at the root level */}
        <CreatePostModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onPostCreated={() => {
            window.location.reload(); 
          }}
        />

      </div>
    </NativeWrapper>
  );
}

export default App;
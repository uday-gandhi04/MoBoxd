import { useState, useEffect } from 'react';
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

function NativeWrapper({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let backHandle;
    let urlHandle;
    let tapHandle;

    const setupListeners = async () => {
      // ==========================================
      // 1. Hardware Back Button
      // ==========================================
      backHandle = await CapApp.addListener(
        'backButton',
        ({ canGoBack }) => {
          if (canGoBack) {
            navigate(-1);
          } else {
            CapApp.exitApp();
          }
        }
      );

      // ==========================================
      // 2. Universal Deep Links
      // ==========================================
      urlHandle = await CapApp.addListener(
        'appUrlOpen',
        (data) => {
          try {
            const parsed = new URL(data.url);
            const targetPath =
              `${parsed.pathname}${parsed.search}`;

            if (targetPath && targetPath !== '/') {
              navigate(targetPath);
            }
          } catch {
            // Fallback for custom schemes
            const slug = data.url.split('.com').pop();

            if (slug) {
              navigate(slug);
            }
          }
        }
      );

      // ==========================================
      // 3. Push Notification Tap Event
      // ==========================================
      tapHandle = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          console.log(
            '🔔 Notification tapped:',
            notification
          );

          const targetUrl =
            notification.notification?.data?.url ||
            notification.notification?.data?.route;

          if (targetUrl) {
            navigate(targetUrl);
          }
        }
      );
    };

    setupListeners();

    return () => {
      backHandle?.remove();
      urlHandle?.remove();
      tapHandle?.remove();
    };
  }, [navigate]);

  return <>{children}</>;
}

function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  return (
    <NativeWrapper>
      <div className="flex h-screen bg-moboxd-bg text-moboxd-text overflow-hidden font-sans">

        {/* Mobile Header */}
        <MobileHeader />

        {/* Desktop Sidebar */}
        <Sidebar
          onOpenCreateModal={() =>
            setIsCreateModalOpen(true)
          }
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pt-16 pb-20 md:pt-0 md:pb-0 w-full relative">
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/posts/:id"
              element={<PostDetail />}
            />
            <Route
              path="/profile/:username"
              element={<Profile />}
            />
            <Route
              path="/activity"
              element={<Activity />}
            />
            <Route
              path="/rankings/new"
              element={<CreateRanking />}
            />
            <Route
              path="/rankings/:id"
              element={<RankingArena />}
            />
            <Route
              path="/rankings"
              element={<RankingsFeed />}
            />
            <Route
              path="/category/:categoryName"
              element={<CategoryFeed />}
            />
          </Routes>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav
          onOpenCreateModal={() =>
            setIsCreateModalOpen(true)
          }
        />

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() =>
            setIsCreateModalOpen(false)
          }
          onPostCreated={() => {
            window.location.reload();
          }}
        />
      </div>
    </NativeWrapper>
  );
}

export default App;
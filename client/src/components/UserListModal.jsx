import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const UserListModal = ({
  isOpen,
  onClose,
  username,
  initialTab = "followers",
  onFollowChange,
}) => {
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [followLoading, setFollowLoading] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;

    setUsers([]);
    setPage(1);
    setHasMore(false);
    setError("");

    fetchUsers(1, activeTab, true);
  }, [isOpen, activeTab, username]);

  const fetchUsers = async (
    requestedPage,
    tab,
    replace = false,
  ) => {
    try {
      setLoading(true);
      setError("");

      const endpoint =
        tab === "followers"
          ? "followers"
          : "following";

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users/${encodeURIComponent(
          username,
        )}/${endpoint}?page=${requestedPage}&limit=25`,
        user?.token
          ? {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            }
          : undefined,
      );

      const fetchedUsers = response.data?.users || [];

      setUsers((prev) =>
        replace ? fetchedUsers : [...prev, ...fetchedUsers],
      );

      setPage(requestedPage);
      setHasMore(Boolean(response.data?.hasMore));
    } catch (err) {
      console.error(
        `Failed to load ${tab}:`,
        err,
      );

      setError(
        err.response?.data?.message ||
          `Failed to load ${tab}.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (loading || !hasMore) return;

    fetchUsers(page + 1, activeTab);
  };

  const handleFollowToggle = async (targetUserId) => {
    if (!user?.token || !targetUserId) return;

    setFollowLoading((prev) => ({
      ...prev,
      [targetUserId]: true,
    }));

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/${targetUserId}/follow`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const isFollowing =
        response.data?.isFollowing;

      setUsers((prev) =>
        prev.map((item) =>
          item._id === targetUserId
            ? {
                ...item,
                isFollowing,
              }
            : item,
        ),
      );

      onFollowChange?.(
        targetUserId,
        isFollowing,
      );
    } catch (err) {
      console.error(
        "Failed to update follow status:",
        err,
      );
    } finally {
      setFollowLoading((prev) => ({
        ...prev,
        [targetUserId]: false,
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[80vh] sm:max-w-md bg-moboxd-card sm:rounded-2xl border border-[#2A2A35] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A35]">
          <h2 className="text-lg font-bold text-white">
            {activeTab === "followers"
              ? "Followers"
              : "Following"}
          </h2>

          <button
            onClick={onClose}
            className="text-moboxd-muted hover:text-white text-2xl transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2A2A35]">
          <button
            onClick={() => setActiveTab("followers")}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              activeTab === "followers"
                ? "text-white border-b-2 border-moboxd-accent"
                : "text-moboxd-muted hover:text-white"
            }`}
          >
            Followers
          </button>

          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              activeTab === "following"
                ? "text-white border-b-2 border-moboxd-accent"
                : "text-moboxd-muted hover:text-white"
            }`}
          >
            Following
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-6 text-center">
              <p className="text-red-400 text-sm">
                {error}
              </p>

              <button
                onClick={() =>
                  fetchUsers(
                    1,
                    activeTab,
                    true,
                  )
                }
                className="mt-3 text-moboxd-accent font-bold text-sm hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!error && loading && users.length === 0 && (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 animate-pulse"
                >
                  <div className="w-11 h-11 rounded-full bg-[#2A2A35]" />

                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 bg-[#2A2A35] rounded" />
                    <div className="h-3 w-20 bg-[#2A2A35] rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!error &&
            !loading &&
            users.length === 0 && (
              <div className="py-16 px-6 text-center">
                <div className="text-4xl mb-3">
                  👥
                </div>

                <p className="text-white font-bold">
                  {activeTab === "followers"
                    ? "No followers yet"
                    : "Not following anyone yet"}
                </p>
              </div>
            )}

          {!error &&
            users.map((item) => {
              const isCurrentUser =
                user?._id === item._id;

              return (
                <div
                  key={item._id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-[#1A1A21] transition-colors"
                >
                  {/* Avatar */}
                  <Link
                    to={`/profile/${item.username}`}
                    onClick={onClose}
                    className="shrink-0"
                  >
                    {item.profilePicture ? (
                      <img
                        src={item.profilePicture}
                        alt={item.username}
                        className="w-11 h-11 rounded-full object-cover border border-[#2A2A35]"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#2A2A35] flex items-center justify-center text-white font-bold">
                        {item.username
                          ?.charAt(0)
                          ?.toUpperCase() || "?"}
                      </div>
                    )}
                  </Link>

                  {/* User information */}
                  <Link
                    to={`/profile/${item.username}`}
                    onClick={onClose}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-white font-bold truncate">
                      {item.displayName ||
                        item.username}
                    </p>

                    <p className="text-moboxd-muted text-sm truncate">
                      @{item.username}
                    </p>
                  </Link>

                  {/* Follow button */}
                  {user && !isCurrentUser && (
                    <button
                      onClick={() =>
                        handleFollowToggle(item._id)
                      }
                      disabled={
                        followLoading[item._id]
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 ${
                        item.isFollowing
                          ? "bg-[#2A2A35] text-white hover:bg-red-500/20 hover:text-red-400"
                          : "bg-moboxd-accent text-black hover:bg-yellow-400"
                      }`}
                    >
                      {followLoading[item._id]
                        ? "..."
                        : item.isFollowing
                          ? "Following"
                          : "Follow"}
                    </button>
                  )}
                </div>
              );
            })}

          {hasMore && !error && (
            <div className="p-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-[#2A2A35] text-white text-sm font-bold hover:bg-[#353541] disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : "Load more"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListModal;
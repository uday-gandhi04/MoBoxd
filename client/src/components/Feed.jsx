import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import FeedSkeleton from "./FeedSkeleton";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarkLoading, setBookmarkLoading] = useState({});
  const [likeLoading, setLikeLoading] = useState({});

  const { user, setUser } = useContext(AuthContext);

  // 1. Fetch feed strictly on mount or when the auth token changes.
  // This prevents the feed from jumping or reloading when interacting with posts.
  useEffect(() => {
    const fetchPersonalFeed = async () => {
      if (!user?.token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/posts/feed`,
          { headers: { Authorization: `Bearer ${user.token}` } },
        );
        setPosts(response.data);
      } catch (err) {
        setError("Failed to load your feed. Is the server running?");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalFeed();
  }, [user?.token]);

  // 2. Memoize bookmarks into an O(1) Set lookup.
  // This prevents running .some() on every post during every render.
  const bookmarkedIds = useMemo(() => {
    const ids =
      user?.bookmarks?.map((id) =>
        String(typeof id === "object" ? id._id : id),
      ) || [];
    return new Set(ids);
  }, [user?.bookmarks]);

  // 3. Optimistic Like Functionality
  const handleLike = useCallback(
    async (e, postId) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) return alert("Please log in to like moments.");
      if (likeLoading[postId]) return;

      setLikeLoading((prev) => ({ ...prev, [postId]: true }));

      const previousPosts = [...posts];

      // Optimistic UI Update
      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (post._id === postId) {
            const isLiked = post.likes?.includes(user._id);
            const newLikes = isLiked
              ? post.likes.filter((id) => id !== user._id)
              : [...(post.likes || []), user._id];
            return { ...post, likes: newLikes };
          }
          return post;
        }),
      );

      try {
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/posts/${postId}/like`,
          {},
          { headers: { Authorization: `Bearer ${user.token}` } },
        );

        // Sync with the backend's absolute truth
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post._id === postId ? { ...post, likes: response.data } : post,
          ),
        );
      } catch (error) {
        console.error("Error toggling like:", error);
        // Revert if API fails
        setPosts(previousPosts);
      } finally {
        setLikeLoading((prev) => ({ ...prev, [postId]: false }));
      }
    },
    [user, posts, likeLoading],
  );

  // 4. Optimistic Bookmark Functionality
  const handleBookmark = useCallback(
    async (e, postId) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) return alert("Please log in to save moments.");
      if (bookmarkLoading[postId]) return;

      setBookmarkLoading((prev) => ({ ...prev, [postId]: true }));

      const oldBookmarks = user.bookmarks || [];
      const isBookmarked = bookmarkedIds.has(String(postId));

      // Calculate new array ensuring we extract proper IDs
      const updatedBookmarks = isBookmarked
        ? oldBookmarks.filter((id) => {
            const bId = typeof id === "object" ? id._id : id;
            return String(bId) !== String(postId);
          })
        : [...oldBookmarks, postId];

      // Optimistic UI Update (AuthContext handles localStorage synchronization natively)
      if (typeof setUser === "function") {
        setUser((prev) => ({ ...prev, bookmarks: updatedBookmarks }));
      }

      try {
        const res = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/users/bookmarks/${postId}`,
          {},
          { headers: { Authorization: `Bearer ${user.token}` } },
        );

        // Sync with the backend's absolute truth
        if (typeof setUser === "function") {
          setUser((prev) => ({ ...prev, bookmarks: res.data || [] }));
        }
      } catch (err) {
        console.error("Error toggling bookmark:", err);
        // Revert if API fails
        if (typeof setUser === "function") {
          setUser((prev) => ({ ...prev, bookmarks: oldBookmarks }));
        }
      } finally {
        setBookmarkLoading((prev) => ({ ...prev, [postId]: false }));
      }
    },
    [user, bookmarkedIds, bookmarkLoading, setUser],
  );

  // 5. Memoized Share Handler
  const handleShare = useCallback(async (e, postId, authorName) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Default to exactly where the browser currently is (handles local web & prod web)
    let siteUrl = window.location.origin;

    // 2. Override ONLY if running natively on a phone (fixes the Android/iOS localhost issue)
    if (Capacitor.isNativePlatform()) {
      siteUrl = import.meta.env.VITE_SITE_URL;
    }

    const url = `${siteUrl}/posts/${postId}`;
    const shareTitle = `Check out this moment by @${authorName} on MoBoxd`;

    try {
      if (Capacitor.isNativePlatform()) {
        // --- NATIVE SHARE (Android / iOS) ---
        await Share.share({
          title: shareTitle,
          text: shareTitle, // iOS often prefers the text field
          url: url,
          dialogTitle: "Share this MoBoxd moment",
        });
      } else if (navigator.share) {
        // --- WEB SHARE (Mobile Browsers) ---
        await navigator.share({
          title: shareTitle,
          url: url,
        });
      } else {
        // --- FALLBACK (Desktop Browsers) ---
        await navigator.clipboard.writeText(url);
        alert("Post link copied to clipboard!");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.log("Share cancelled or failed", err);
      }
    }
  }, []);

  // UI for logged-out users
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 pt-20">
        <i className="bi bi-box-seam text-moboxd-accent text-6xl mb-4 block"></i>
        <h2 className="text-3xl font-bold text-white mb-4">
          Welcome to MoBoxd
        </h2>
        <p className="text-moboxd-muted text-lg">
          <Link
            to="/login"
            className="text-moboxd-accent font-bold hover:underline"
          >
            Log in
          </Link>{" "}
          to see moments from your friends, <br />
          or head to the{" "}
          <Link
            to="/explore"
            className="text-moboxd-accent font-bold hover:underline"
          >
            Explore
          </Link>{" "}
          page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[470px] mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2A2A35]">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Your Feed
        </h1>
      </div>

      {loading && <FeedSkeleton />}

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <div className="text-center text-moboxd-muted mt-20">
          <i className="bi bi-people text-5xl mb-4 block"></i>
          <h5 className="text-xl font-bold text-white mb-2">
            You aren't following anyone yet.
          </h5>
          <p>
            Head over to the{" "}
            <Link to="/explore" className="text-moboxd-accent hover:underline">
              Explore
            </Link>{" "}
            page to find friends!
          </p>
        </div>
      )}

      {/* Posts Feed */}
      {!loading &&
        !error &&
        Array.isArray(posts) &&
        posts.map((post) => {
          const isLiked = post.likes?.includes(user._id);
          const isBookmarked = bookmarkedIds.has(String(post._id));

          return (
            <div
              key={post._id}
              className="bg-moboxd-card rounded-2xl overflow-hidden mb-8 border border-[#2A2A35] shadow-lg"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Link
                    to={`/profile/${post.author.username}`}
                    className="w-10 h-10 rounded-full bg-[#2A2A35] flex items-center justify-center overflow-hidden"
                  >
                    {post.author.profilePicture ? (
                      <img
                        src={post.author.profilePicture}
                        alt={post.author.username}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <i className="bi bi-person-fill text-moboxd-muted"></i>
                    )}
                  </Link>
                  <Link
                    to={`/profile/${post.author.username}`}
                    className="font-bold text-white hover:text-moboxd-accent transition-colors"
                  >
                    {post.author.username}
                  </Link>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-[#2A2A35] rounded-full text-moboxd-muted uppercase tracking-wider">
                  {post.category}
                </span>
              </div>

              {/* Image (Added loading lazy for performance) */}
              <Link to={`/posts/${post._id}`} className="block">
                <img
                  src={post.imageUrl}
                  alt={post.category}
                  className="w-full aspect-[4/5] object-cover"
                  loading="lazy"
                />
              </Link>

              {/* Card Body */}
              <div className="p-4">
                <p className="text-white mb-4 text-lg">{post.caption}</p>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-moboxd-muted uppercase tracking-wider font-bold me-2">
                    Author Rating
                  </span>
                  <div className="flex text-moboxd-accent text-sm">
                    {[...Array(5)].map((_, i) => {
                      if (post.authorRating >= i + 1) {
                        return <i key={i} className="bi bi-star-fill"></i>;
                      } else if (post.authorRating > i) {
                        return <i key={i} className="bi bi-star-half"></i>;
                      } else {
                        return <i key={i} className="bi bi-star"></i>;
                      }
                    })}
                  </div>
                  <span className="font-bold text-white ms-1">
                    {Number(post.authorRating).toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-4 py-3 border-t border-[#2A2A35] flex items-center justify-between">
                {/* Left Side: Like & Comment */}
                <div className="flex items-center gap-6">
                  <button
                    disabled={likeLoading[post._id]}
                    onClick={(e) => handleLike(e, post._id)}
                    className="flex items-center gap-2 group transition-colors focus:outline-none disabled:opacity-50"
                  >
                    {likeLoading[post._id] ? (
                      <div className="w-4 h-4 border-2 border-moboxd-muted border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <i
                        className={`bi bi-heart${
                          isLiked
                            ? "-fill text-red-500"
                            : " text-moboxd-muted group-hover:text-red-500"
                        }`}
                      ></i>
                    )}
                    <span
                      className={
                        isLiked
                          ? "text-white font-medium"
                          : "text-moboxd-muted group-hover:text-white font-medium"
                      }
                    >
                      {post.likes?.length || 0}
                    </span>
                  </button>

                  <Link
                    to={`/posts/${post._id}`}
                    className="flex items-center gap-2 group transition-colors"
                  >
                    <i className="bi bi-chat text-moboxd-muted group-hover:text-white"></i>
                    <span className="text-moboxd-muted group-hover:text-white font-medium">
                      {post.totalReviews}
                    </span>
                  </Link>
                </div>

                {/* Right Side: Share & Bookmark */}
                <div className="flex items-center gap-5">
                  <button
                    onClick={(e) =>
                      handleShare(e, post._id, post.author.username)
                    }
                    className="group transition-colors focus:outline-none flex items-center"
                    title="Share"
                  >
                    <i className="text-lg bi bi-share text-moboxd-muted group-hover:text-white"></i>
                  </button>

                  <button
                    disabled={bookmarkLoading[post._id]}
                    onClick={(e) => handleBookmark(e, post._id)}
                    className="group transition-colors focus:outline-none flex items-center disabled:opacity-50"
                    title={isBookmarked ? "Unsave" : "Save"}
                  >
                    {bookmarkLoading[post._id] ? (
                      <div className="w-4 h-4 border-2 border-moboxd-muted border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <i
                        className={`text-lg bi ${
                          isBookmarked
                            ? "bi-bookmark-fill text-moboxd-accent"
                            : "bi-bookmark text-moboxd-muted group-hover:text-white"
                        }`}
                      ></i>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default Feed;

import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import FeedSkeleton from "./FeedSkeleton";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [globalPosts, setGlobalPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);

  // Added bookmarkLoading state to track individual post loading states
  const [bookmarkLoading, setBookmarkLoading] = useState({});

  // Added setUser to update the context optimistically
  const { user, setUser } = useContext(AuthContext);

  // Fetch Global Posts
  useEffect(() => {
    const fetchGlobalPosts = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/posts`,
        );
        setGlobalPosts(response.data);
      } catch (error) {
        console.error("Error fetching global posts:", error);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchGlobalPosts();
  }, []);

  // Handle Live Search
  useEffect(() => {
    const fetchUsers = async () => {
      if (searchQuery.trim() === "") {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users/search?q=${searchQuery}`,
        );
        setSearchResults(response.data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Memoize bookmarks into an O(1) Set lookup
  const bookmarkedIds = useMemo(() => {
    const ids =
      user?.bookmarks?.map((id) =>
        String(typeof id === "object" ? id._id : id),
      ) || [];
    return new Set(ids);
  }, [user?.bookmarks]);

  const handleLike = async (postId) => {
    if (!user) return alert("Please log in to like moments.");

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } },
      );

      setGlobalPosts(
        globalPosts.map((post) =>
          post._id === postId ? { ...post, likes: response.data } : post,
        ),
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Optimistic Bookmark Functionality
  const handleBookmark = useCallback(
    async (e, postId) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) return alert("Please log in to save moments.");
      if (bookmarkLoading[postId]) return;

      setBookmarkLoading((prev) => ({ ...prev, [postId]: true }));

      const oldBookmarks = user.bookmarks || [];
      const isBookmarked = bookmarkedIds.has(String(postId));

      const updatedBookmarks = isBookmarked
        ? oldBookmarks.filter((id) => {
            const bId = typeof id === "object" ? id._id : id;
            return String(bId) !== String(postId);
          })
        : [...oldBookmarks, postId];

      if (typeof setUser === "function") {
        setUser((prev) => ({ ...prev, bookmarks: updatedBookmarks }));
      }

      try {
        const res = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/users/bookmarks/${postId}`,
          {},
          { headers: { Authorization: `Bearer ${user.token}` } },
        );

        if (typeof setUser === "function") {
          setUser((prev) => ({ ...prev, bookmarks: res.data || [] }));
        }
      } catch (err) {
        console.error("Error toggling bookmark:", err);
        if (typeof setUser === "function") {
          setUser((prev) => ({ ...prev, bookmarks: oldBookmarks }));
        }
      } finally {
        setBookmarkLoading((prev) => ({ ...prev, [postId]: false }));
      }
    },
    [user, bookmarkedIds, bookmarkLoading, setUser],
  );

  // Memoized Share Handler
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

  return (
    <div className="max-w-[470px] mx-auto py-8 px-4">
      {/* Search Bar */}
      <div className="bg-[#1A1A21] border border-[#2A2A35] rounded-2xl p-4 flex items-center mb-8 shadow-sm transition-colors focus-within:border-moboxd-accent">
        <i className="bi bi-search text-moboxd-muted text-xl me-4"></i>
        <input
          type="text"
          className="bg-transparent border-0 text-white w-full focus:outline-none placeholder-moboxd-muted/60 text-lg"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="mb-10">
          <h5 className="text-moboxd-muted font-bold tracking-widest uppercase text-xs mb-4">
            Search Results
          </h5>

          {loading ? (
            <div className="flex justify-center mt-6">
              <div className="w-6 h-6 border-2 border-moboxd-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="flex flex-col gap-2">
              {searchResults.map((searchUser) => (
                <Link
                  key={searchUser._id}
                  to={`/profile/${searchUser.username}`}
                  className="bg-[#1A1A21] border border-[#2A2A35] hover:border-moboxd-accent rounded-xl p-4 flex items-center gap-4 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#2A2A35] flex items-center justify-center overflow-hidden shrink-0">
                    {searchUser.profilePicture ? (
                      <img
                        src={searchUser.profilePicture}
                        alt={searchUser.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="bi bi-person-fill text-moboxd-muted text-xl"></i>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-white text-lg block">
                      {searchUser.username}
                    </span>
                    <span className="text-moboxd-muted text-sm">
                      @{searchUser.username.toLowerCase()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-6 text-center text-moboxd-muted">
              No users found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Global Feed (Displays when search is empty) */}
      {!searchQuery && (
        <>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2A2A35]">
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Global Moments
            </h1>
          </div>

          {postsLoading ? (
            <FeedSkeleton />
          ) : (
            globalPosts.map((post) => {
              const isLiked = user && post.likes?.includes(user._id);
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

                  {/* Image */}
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
                          const rating = post.authorRating;
                          let iconClass = "bi-star";
                          if (rating >= i + 1) iconClass = "bi-star-fill";
                          else if (rating === i + 0.5)
                            iconClass = "bi-star-half";
                          return <i key={i} className={`bi ${iconClass}`}></i>;
                        })}
                      </div>
                      <span className="font-bold text-white ms-1">
                        {post.authorRating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer updated to match Feed.jsx structure */}
                  <div className="px-4 py-3 border-t border-[#2A2A35] flex items-center justify-between">
                    {/* Left Side: Like & Comment */}
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleLike(post._id)}
                        className="flex items-center gap-2 group transition-colors focus:outline-none cursor-pointer"
                      >
                        <i
                          className={`bi bi-heart${
                            isLiked
                              ? "-fill text-red-500"
                              : " text-moboxd-muted group-hover:text-red-500"
                          }`}
                        ></i>
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
            })
          )}
        </>
      )}
    </div>
  );
};

export default Explore;

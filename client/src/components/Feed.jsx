import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user, setUser } = useContext(AuthContext);

  const [savedPostIds, setSavedPostIds] = useState(user?.bookmarks || []);

  useEffect(() => {
    const fetchPersonalFeed = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(
          "${import.meta.env.VITE_API_URL}/api/posts/feed",
          {
            headers: { Authorization: `Bearer ${user.token}` },
          },
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
  }, [user]);

  const handleLike = async (postId) => {
    if (!user) return alert("Please log in to like moments.");
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } },
      );
      setPosts(
        posts.map((post) =>
          post._id === postId ? { ...post, likes: response.data } : post,
        ),
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleBookmark = async (postId) => {
    if (!user) return alert('Please log in to save moments.');
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/bookmarks/${postId}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      const updatedBookmarks = response.data || [];

      // 1. UPDATE LOCAL STATE (This forces the immediate UI visual toggle!)
      setSavedPostIds(updatedBookmarks);

      // 2. Update global state in the background
      if (typeof setUser === 'function') {
        setUser(prev => ({ ...prev, bookmarks: updatedBookmarks }));
      }
      
      // 3. Update localStorage so a page refresh doesn't break it
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        localStorage.setItem('user', JSON.stringify({ ...storedUser, bookmarks: updatedBookmarks }));
      }
      
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleShare = async (postId, authorName) => {
    // Construct the absolute URL to the specific post
    const url = `${window.location.origin}/posts/${postId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this moment by @${authorName} on MoBoxd`,
          url: url,
        });
      } catch (err) {
        console.log("Share cancelled", err);
      }
    } else {
      // Fallback for desktop browsers that don't support native sharing
      navigator.clipboard.writeText(url);
      alert("Post link copied to clipboard!");
    }
  };

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
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2A2A35]">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Your Feed
        </h1>
      </div>

      {loading && (
        <div className="flex justify-center mt-10">
          <div className="w-8 h-8 border-4 border-moboxd-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

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
        !error && Array.isArray(posts) && 
        posts.map((post) => {
          const isLiked = post.likes?.includes(user._id);

          const isBookmarked = Array.isArray(savedPostIds) && savedPostIds.some((bookmark) => {
              const bookmarkId = typeof bookmark === "object" ? bookmark._id : bookmark;
              return String(bookmarkId) === String(post._id);
            });

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
                  className="w-full h-[400px] object-cover"
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
                      // Determine if the star should be full, half, or empty
                      if (post.authorRating >= i + 1) {
                        return <i key={i} className="bi bi-star-fill"></i>;
                      } else if (post.authorRating > i) {
                        return <i key={i} className="bi bi-star-half"></i>;
                      } else {
                        return <i key={i} className="bi bi-star"></i>;
                      }
                    })}
                  </div>
                  {/* Use toFixed(1) to guarantee formats like 4.0 or 4.5 */}
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
                    onClick={() => handleLike(post._id)}
                    className="flex items-center gap-2 group transition-colors focus:outline-none"
                  >
                    <i
                      className={`bi bi-heart${isLiked ? "-fill text-red-500" : " text-moboxd-muted group-hover:text-red-500"}`}
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
                  {/* Share Button */}
                  <button
                    onClick={() => handleShare(post._id, post.author.username)}
                    className="group transition-colors focus:outline-none flex items-center"
                    title="Share"
                  >
                    <i className="text-lg bi bi-share text-moboxd-muted group-hover:text-white"></i>
                  </button>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => handleBookmark(post._id)}
                    className="group transition-colors focus:outline-none flex items-center"
                    title={isBookmarked ? "Unsave" : "Save"}
                  >
                    <i
                      className={`text-lg bi ${
                        isBookmarked
                          ? "bi-bookmark-fill text-moboxd-accent"
                          : "bi-bookmark text-moboxd-muted group-hover:text-white"
                      }`}
                    ></i>
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

import {
  useState,
  useEffect,
  useContext,
} from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { AuthContext } from "../context/AuthContext";
import PostFeed from "./PostFeed";
import usePostActions from "../hooks/usePostActions";

const Feed = () => {
  const {
    user,
    setUser,
  } = useContext(AuthContext);

  const [posts, setPosts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================================
  // FETCH PERSONAL FEED
  // ==========================================================

  useEffect(() => {
    const fetchPersonalFeed =
      async () => {
        if (!user?.token) {
          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        try {
          const response =
            await axios.get(
              `${import.meta.env.VITE_API_URL}/api/posts/feed`,
              {
                headers: {
                  Authorization:
                    `Bearer ${user.token}`,
                },
              }
            );

          setPosts(
            response.data
          );

        } catch (error) {
          console.error(
            "Failed to load feed:",
            error
          );

          setError(
            "Failed to load your feed. Is the server running?"
          );

        } finally {
          setLoading(false);
        }
      };

    fetchPersonalFeed();
  }, [user?.token]);

  // ==========================================================
  // POST ACTIONS
  // ==========================================================

  const {
    bookmarkedIds,
    likeLoading,
    bookmarkLoading,
    handleLike,
    handleBookmark,
    handleShare,
  } = usePostActions({
    posts,
    setPosts,
    user,
    setUser,
  });

  // ==========================================================
  // LOGGED OUT
  // ==========================================================

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 pt-20">

        <i className="bi bi-box-seam text-moboxd-accent text-6xl mb-4 block" />

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
          to see moments from your friends,
          <br />
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

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2A2A35]">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Your Feed
        </h1>
      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* ====================================================
          POSTS
      ==================================================== */}

      <PostFeed
        posts={posts}
        loading={loading}
        user={user}
        bookmarkedIds={
          bookmarkedIds
        }
        likeLoading={
          likeLoading
        }
        bookmarkLoading={
          bookmarkLoading
        }
        onLike={
          handleLike
        }
        onBookmark={
          handleBookmark
        }
        onShare={
          handleShare
        }
        emptyMessage={
          "Follow people to see their moments here."
        }
      />

    </div>
  );
};

export default Feed;
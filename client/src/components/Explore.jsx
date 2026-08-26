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

const Explore = () => {
  // ==========================================================
  // SEARCH STATE
  // ==========================================================

  const [searchQuery, setSearchQuery] =
    useState("");

  const [searchResults, setSearchResults] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  // ==========================================================
  // GLOBAL POSTS
  // ==========================================================

  const [globalPosts, setGlobalPosts] =
    useState([]);

  const [postsLoading, setPostsLoading] =
    useState(true);

  // ==========================================================
  // AUTH
  // ==========================================================

  const {
    user,
    setUser,
  } = useContext(AuthContext);

  // ==========================================================
  // FETCH GLOBAL MOMENTS
  // ==========================================================

  useEffect(() => {
    const fetchGlobalPosts = async () => {
      setPostsLoading(true);

      try {
        const response =
          await axios.get(
            `${import.meta.env.VITE_API_URL}/api/posts`
          );

        setGlobalPosts(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "Error fetching global posts:",
          error
        );
      } finally {
        setPostsLoading(false);
      }
    };

    fetchGlobalPosts();
  }, []);

  // ==========================================================
  // USER SEARCH
  // ==========================================================

  useEffect(() => {
    const fetchUsers = async () => {
      const query =
        searchQuery.trim();

      if (!query) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response =
          await axios.get(
            `${import.meta.env.VITE_API_URL}/api/users/search`,
            {
              params: {
                q: query,
              },
            }
          );

        setSearchResults(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "Search failed:",
          error
        );

        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn =
      setTimeout(
        fetchUsers,
        300
      );

    return () =>
      clearTimeout(
        delayDebounceFn
      );
  }, [searchQuery]);

  // ==========================================================
  // REUSABLE POST ACTIONS
  // ==========================================================

  const {
    bookmarkedIds,
    likeLoading,
    bookmarkLoading,
    handleLike,
    handleBookmark,
    handleShare,
  } = usePostActions({
    posts: globalPosts,
    setPosts: setGlobalPosts,
    user,
    setUser,
  });

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="max-w-[470px] mx-auto py-8 px-4">

      {/* ====================================================
          SEARCH BAR
      ==================================================== */}

      <div className="bg-[#1A1A21] border border-[#2A2A35] rounded-2xl p-4 flex items-center mb-8 shadow-sm transition-colors focus-within:border-moboxd-accent">

        <i className="bi bi-search text-moboxd-muted text-xl me-4"></i>

        <input
          type="text"
          className="bg-transparent border-0 text-white w-full focus:outline-none placeholder-moboxd-muted/60 text-lg"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(
              e.target.value
            )
          }
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() =>
              setSearchQuery("")
            }
            className="text-moboxd-muted hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <i className="bi bi-x-circle-fill"></i>
          </button>
        )}

      </div>

      {/* ====================================================
          USER SEARCH RESULTS
      ==================================================== */}

      {searchQuery && (
        <div className="mb-10">

          <h5 className="text-moboxd-muted font-bold tracking-widest uppercase text-xs mb-4">
            People
          </h5>

          {loading ? (
            <div className="flex justify-center mt-6">
              <div className="w-6 h-6 border-2 border-moboxd-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="flex flex-col gap-2">

              {searchResults.map(
                (searchUser) => (
                  <Link
                    key={searchUser._id}
                    to={`/profile/${searchUser.username}`}
                    className="bg-[#1A1A21] border border-[#2A2A35] hover:border-moboxd-accent rounded-xl p-4 flex items-center gap-4 transition-colors"
                  >

                    <div className="w-12 h-12 rounded-full bg-[#2A2A35] flex items-center justify-center overflow-hidden shrink-0">

                      {searchUser.profilePicture ? (
                        <img
                          src={
                            searchUser.profilePicture
                          }
                          alt={
                            searchUser.username
                          }
                          className="w-full h-full object-cover"
                          loading="lazy"
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
                )
              )}

            </div>
          ) : (
            <div className="bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-6 text-center text-moboxd-muted">
              No users found matching "{searchQuery}"
            </div>
          )}

        </div>
      )}

      {/* ====================================================
          GLOBAL MOMENTS
      ==================================================== */}

      {!searchQuery && (
        <>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2A2A35]">

            <h1 className="text-2xl font-bold text-white tracking-wide">
              Global Moments
            </h1>

          </div>

          <PostFeed
            posts={globalPosts}
            loading={postsLoading}
            user={user}
            bookmarkedIds={bookmarkedIds}
            likeLoading={likeLoading}
            bookmarkLoading={bookmarkLoading}
            onLike={handleLike}
            onBookmark={handleBookmark}
            onShare={handleShare}
            emptyMessage="No public moments have been posted yet."
          />
        </>
      )}

    </div>
  );
};

export default Explore;
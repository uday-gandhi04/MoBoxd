import { useState, useCallback, useMemo } from "react";
import axios from "axios";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

const usePostActions = ({
  posts,
  setPosts,
  user,
  setUser,
}) => {
  const [likeLoading, setLikeLoading] = useState({});
  const [bookmarkLoading, setBookmarkLoading] =
    useState({});

  // ==========================================================
  // BOOKMARK LOOKUP
  // ==========================================================

  const bookmarkedIds = useMemo(() => {
    const ids =
      user?.bookmarks?.map((id) =>
        String(
          typeof id === "object"
            ? id._id
            : id
        )
      ) || [];

    return new Set(ids);
  }, [user?.bookmarks]);

  // ==========================================================
  // LIKE
  // ==========================================================

  const handleLike = useCallback(
    async (e, postId) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (!user) {
        alert(
          "Please log in to like moments."
        );
        return;
      }

      if (likeLoading[postId]) {
        return;
      }

      setLikeLoading((prev) => ({
        ...prev,
        [postId]: true,
      }));

      const previousPosts = [...posts];

      // ------------------------------------------------------
      // Optimistic update
      // ------------------------------------------------------

      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (
            String(post._id) !==
            String(postId)
          ) {
            return post;
          }

          const currentLikes =
            post.likes || [];

          const isLiked =
            currentLikes.some(
              (id) =>
                String(id) ===
                String(user._id)
            );

          const newLikes = isLiked
            ? currentLikes.filter(
                (id) =>
                  String(id) !==
                  String(user._id)
              )
            : [
                ...currentLikes,
                user._id,
              ];

          return {
            ...post,
            likes: newLikes,
          };
        })
      );

      try {
        const response =
          await axios.put(
            `${import.meta.env.VITE_API_URL}/api/posts/${postId}/like`,
            {},
            {
              headers: {
                Authorization:
                  `Bearer ${user.token}`,
              },
            }
          );

        // ----------------------------------------------------
        // Sync backend truth
        // ----------------------------------------------------

        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            String(post._id) ===
            String(postId)
              ? {
                  ...post,
                  likes:
                    response.data,
                }
              : post
          )
        );

      } catch (error) {
        console.error(
          "Error toggling like:",
          error
        );

        // ----------------------------------------------------
        // Rollback optimistic update
        // ----------------------------------------------------

        setPosts(previousPosts);

      } finally {
        setLikeLoading((prev) => ({
          ...prev,
          [postId]: false,
        }));
      }
    },
    [
      posts,
      setPosts,
      user,
      likeLoading,
    ]
  );

  // ==========================================================
  // BOOKMARK
  // ==========================================================

  const handleBookmark = useCallback(
    async (e, postId) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (!user) {
        alert(
          "Please log in to save moments."
        );
        return;
      }

      if (
        bookmarkLoading[postId]
      ) {
        return;
      }

      setBookmarkLoading(
        (prev) => ({
          ...prev,
          [postId]: true,
        })
      );

      const oldBookmarks =
        user.bookmarks || [];

      const isBookmarked =
        bookmarkedIds.has(
          String(postId)
        );

      const updatedBookmarks =
        isBookmarked
          ? oldBookmarks.filter(
              (id) => {
                const bookmarkId =
                  typeof id === "object"
                    ? id._id
                    : id;

                return (
                  String(
                    bookmarkId
                  ) !==
                  String(postId)
                );
              }
            )
          : [
              ...oldBookmarks,
              postId,
            ];

      // ------------------------------------------------------
      // Optimistic user update
      // ------------------------------------------------------

      if (
        typeof setUser ===
        "function"
      ) {
        setUser((prev) => ({
          ...prev,
          bookmarks:
            updatedBookmarks,
        }));
      }

      try {
        const response =
          await axios.put(
            `${import.meta.env.VITE_API_URL}/api/users/bookmarks/${postId}`,
            {},
            {
              headers: {
                Authorization:
                  `Bearer ${user.token}`,
              },
            }
          );

        // ----------------------------------------------------
        // Sync backend truth
        // ----------------------------------------------------

        if (
          typeof setUser ===
          "function"
        ) {
          setUser((prev) => ({
            ...prev,
            bookmarks:
              response.data ||
              [],
          }));
        }

      } catch (error) {
        console.error(
          "Error toggling bookmark:",
          error
        );

        // ----------------------------------------------------
        // Rollback
        // ----------------------------------------------------

        if (
          typeof setUser ===
          "function"
        ) {
          setUser((prev) => ({
            ...prev,
            bookmarks:
              oldBookmarks,
          }));
        }

      } finally {
        setBookmarkLoading(
          (prev) => ({
            ...prev,
            [postId]: false,
          })
        );
      }
    },
    [
      user,
      setUser,
      bookmarkedIds,
      bookmarkLoading,
    ]
  );

  // ==========================================================
  // SHARE
  // ==========================================================

  const handleShare =
    useCallback(
      async (
        e,
        postId,
        authorName
      ) => {
        e?.preventDefault();
        e?.stopPropagation();

        // ----------------------------------------------------
        // Determine correct site URL
        // ----------------------------------------------------

        let siteUrl =
          window.location.origin;

        if (
          Capacitor.isNativePlatform()
        ) {
          siteUrl =
            import.meta.env
              .VITE_SITE_URL;
        }

        const url =
          `${siteUrl}/posts/${postId}`;

        const shareTitle =
          `Check out this moment by @${authorName} on MoBoxd`;

        try {
          // --------------------------------------------------
          // Native Android / iOS
          // --------------------------------------------------

          if (
            Capacitor.isNativePlatform()
          ) {
            await Share.share({
              title: shareTitle,
              text: shareTitle,
              url,
              dialogTitle:
                "Share this MoBoxd moment",
            });

            return;
          }

          // --------------------------------------------------
          // Browser Web Share
          // --------------------------------------------------

          if (
            navigator.share
          ) {
            await navigator.share({
              title: shareTitle,
              url,
            });

            return;
          }

          // --------------------------------------------------
          // Desktop fallback
          // --------------------------------------------------

          await navigator.clipboard.writeText(
            url
          );

          alert(
            "Post link copied to clipboard!"
          );

        } catch (error) {
          // User cancelled native/browser share.
          if (
            error?.name !==
            "AbortError"
          ) {
            console.error(
              "Share failed:",
              error
            );
          }
        }
      },
      []
    );

  return {
    bookmarkedIds,
    likeLoading,
    bookmarkLoading,
    handleLike,
    handleBookmark,
    handleShare,
  };
};

export default usePostActions;
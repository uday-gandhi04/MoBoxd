import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import usePostActions from "../hooks/usePostActions";

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Review form state
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const setPostCollection = (updater) => {
    setPost((currentPost) => {
      if (!currentPost) {
        return currentPost;
      }

      const currentPosts = [currentPost];
      const updatedPosts =
        typeof updater === "function"
          ? updater(currentPosts)
          : updater;

      return updatedPosts[0] || currentPost;
    });
  };

  const {
    bookmarkedIds,
    handleBookmark: toggleBookmark,
    handleShare: sharePost,
  } = usePostActions({
    posts: post ? [post] : [],
    setPosts: setPostCollection,
    user,
    setUser,
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const config = user?.token
          ? {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            }
          : {};

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/posts/${id}`,
          config,
        );

        const fetchedPost = response.data.post || response.data;
        setPost(fetchedPost);
      } catch (err) {
        console.error("Error loading post:", err);
        setError("Failed to load the moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, user?.token]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this moment?")) {
      return;
    }

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/posts/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      navigate("/");
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post.");
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert("Please log in to like moments.");
      return;
    }

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/posts/${id}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const updatedLikes = response.data.likes || response.data;

      setPost((prev) => ({
        ...prev,
        likes: updatedLikes,
      }));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleRatingClick = (starValue) => {
    if (reviewRating === starValue) {
      setReviewRating(starValue - 0.5);
    } else {
      setReviewRating(starValue);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Please log in to review.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/posts/${id}/reviews`,
        {
          comment: reviewText,
          rating: reviewRating,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const updatedPost = response.data.post || response.data;

      setPost(updatedPost);
      setReviewText("");
      setReviewRating(5);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/posts/${id}/reviews/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const updatedPost = response.data.post || response.data;

      setPost(updatedPost);
    } catch (err) {
      console.error("Error deleting review:", err);
      alert(err.response?.data?.message || "Failed to delete review");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-moboxd-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold text-red-400 mb-4">
          {error || "Moment not found."}
        </h2>

        <button
          onClick={() => navigate("/")}
          className="text-moboxd-accent hover:underline bg-transparent border-0 cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  const isLiked =
    user &&
    post?.likes?.some((like) => {
      const likeId = like?._id || like;
      return likeId?.toString() === user._id?.toString();
    });

  const isAuthor =
    user &&
    post?.author &&
    (user._id?.toString() ===
      (post.author?._id || post.author)?.toString());

  const authorUsername = post?.author?.username || "Unknown User";
  const authorProfilePic = post?.author?.profilePicture || null;

  const displayDate = post?.createdAt
    ? new Date(post.createdAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const relatedItem = post?.relatedItem || null;

  const relatedUrl = relatedItem?.url || "";
  const relatedType = relatedItem?.type || "";

  const showRelatedLink = Boolean(relatedUrl);

  const tags = Array.isArray(post?.tags)
    ? post.tags.filter(Boolean)
    : [];

  const isBookmarked =
    user &&
    (post?.bookmarks?.some((bookmark) => {
      const bookmarkId = bookmark?._id || bookmark;
      return bookmarkId?.toString() === user?._id?.toString();
    }) || bookmarkedIds.has(String(post._id)));

  const handleBookmark = () => {
    toggleBookmark(undefined, post._id);
  };

  const handleShare = () => {
    sharePost(undefined, post._id, authorUsername);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4 mb-20">
      {/* Back Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-moboxd-muted hover:text-white transition-colors mb-5 sm:mb-6 font-medium cursor-pointer border-0 bg-transparent"
      >
        <i className="bi bi-arrow-left" />
        Back
      </button>

      {/* Main Post Card */}
      <div className="bg-moboxd-card rounded-2xl overflow-hidden border border-[#2A2A35] shadow-2xl mb-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-[#2A2A35]">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              to={`/profile/${authorUsername}`}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2A2A35] flex items-center justify-center overflow-hidden shrink-0"
            >
              {authorProfilePic ? (
                <img
                  src={authorProfilePic}
                  alt={authorUsername}
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className="bi bi-person-fill text-moboxd-muted text-xl" />
              )}
            </Link>

            <div className="min-w-0">
              <Link
                to={`/profile/${authorUsername}`}
                className="font-bold text-white text-base sm:text-lg hover:text-moboxd-accent transition-colors block leading-tight truncate"
              >
                {authorUsername}
              </Link>

              {displayDate && (
                <span className="text-xs text-moboxd-muted">
                  {displayDate}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {post?.category && (
              <span className="text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 bg-[#2A2A35] rounded-full text-moboxd-muted uppercase tracking-wider">
                {post.category}
              </span>
            )}

            {isAuthor && (
              <button
                onClick={handleDelete}
                className="text-moboxd-muted hover:text-red-500 transition-colors cursor-pointer border-0 bg-transparent p-1"
                title="Delete Moment"
              >
                <i className="bi bi-trash3-fill" />
              </button>
            )}
          </div>
        </div>

        {/* Image */}
        {post?.imageUrl && (
          <div className="w-full bg-black">
            <img
              src={post.imageUrl}
              alt={post?.title || post?.caption || post?.category || "Moment"}
              className="w-full aspect-[4/5] object-cover"
            />
          </div>
        )}

        {/* Post Details */}
        <div className="p-5 sm:p-6">
          {/* Title */}
          {post?.title?.trim() && (
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
              {post.title}
            </h1>
          )}

          {/* Caption / Description */}
          {post?.caption?.trim() && (
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed whitespace-pre-wrap mb-6">
              {post.caption}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-[#2A2A35] text-gray-300 border border-[#353541]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* =====================================================
              RELATED ITEM
          ===================================================== */}

          {showRelatedLink && (
            <a
              href={relatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-[#1A1A21] border border-[#2A2A35] text-sm text-white hover:border-moboxd-accent hover:text-moboxd-accent transition-colors"
            >
              <i
                className={
                  relatedType === "PLACE"
                    ? "bi bi-geo-alt"
                    : relatedType === "MUSIC"
                      ? "bi bi-music-note-beamed"
                      : relatedType === "MOVIE_TV"
                        ? "bi bi-film"
                        : relatedType === "BOOK"
                          ? "bi bi-book"
                          : relatedType === "GAME"
                            ? "bi bi-controller"
                            : relatedType === "PRODUCT"
                              ? "bi bi-bag"
                              : relatedType === "ARTICLE"
                                ? "bi bi-file-text"
                                : "bi bi-link-45deg"
                }
              />

              <span>
                {relatedType === "PLACE"
                  ? "Related Place"
                  : relatedType === "MUSIC"
                    ? "Related Music"
                    : relatedType === "MOVIE_TV"
                      ? "Related Movie / TV"
                      : relatedType === "BOOK"
                        ? "Related Book"
                        : relatedType === "GAME"
                          ? "Related Game"
                          : relatedType === "PRODUCT"
                            ? "Related Product"
                            : relatedType === "ARTICLE"
                              ? "Related Article"
                              : "Related Link"}
              </span>

              <i className="bi bi-box-arrow-up-right text-xs" />
            </a>
          )}

          {/* Ratings */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-[#1A1A21] p-4 rounded-xl border border-[#2A2A35]">
            {/* Author Rating */}
            <div className="flex flex-col">
              <span className="text-xs text-moboxd-muted uppercase tracking-wider font-bold mb-1">
                Author Rating
              </span>

              <div className="flex items-center gap-2">
                <div className="flex text-moboxd-accent">
                  {[...Array(5)].map((_, i) => {
                    let iconClass = "bi-star";
                    const rating = post?.authorRating || 0;

                    if (rating >= i + 1) {
                      iconClass = "bi-star-fill";
                    } else if (rating >= i + 0.5) {
                      iconClass = "bi-star-half";
                    }

                    return (
                      <i
                        key={i}
                        className={`bi ${iconClass}`}
                      />
                    );
                  })}
                </div>

                <span className="font-bold text-white text-lg">
                  {Number(post?.authorRating || 0).toFixed(1)}
                </span>
              </div>
            </div>

            <div className="w-px h-10 bg-[#2A2A35] hidden sm:block" />

            {/* Community Rating */}
            <div className="flex flex-col">
              <span className="text-xs text-moboxd-muted uppercase tracking-wider font-bold mb-1">
                Community Avg
              </span>

              <div className="flex items-center gap-2">
                <div className="flex text-moboxd-accent">
                  {[...Array(5)].map((_, i) => {
                    let iconClass = "bi-star";
                    const avgRating =
                      post?.communityAverageRating || 0;

                    if (avgRating >= i + 1) {
                      iconClass = "bi-star-fill";
                    } else if (avgRating >= i + 0.5) {
                      iconClass = "bi-star-half";
                    }

                    return (
                      <i
                        key={i}
                        className={`bi ${iconClass}`}
                      />
                    );
                  })}
                </div>

                <span className="font-bold text-white text-lg">
                  {Number(
                    post?.communityAverageRating || 0,
                  ).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#2A2A35] flex items-center justify-between bg-[#15151B]">
          <div className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 group transition-colors focus:outline-none cursor-pointer border-0 bg-transparent p-0"
            >
              <i
                className={`bi bi-heart${
                  isLiked
                    ? "-fill text-red-500"
                    : " text-moboxd-muted group-hover:text-red-500"
                } text-xl`}
              />

              <span
                className={
                  isLiked
                    ? "text-white font-bold"
                    : "text-moboxd-muted group-hover:text-white font-bold"
                }
              >
                {post?.likes?.length || 0}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <i className="bi bi-chat text-moboxd-muted text-xl" />

              <span className="text-moboxd-muted font-bold">
                {post?.reviews?.length || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={handleShare}
              className="text-moboxd-muted hover:text-white transition-colors cursor-pointer border-0 bg-transparent p-0"
              title="Share Moment"
            >
              <i className="bi bi-share text-xl" />
            </button>

            <button
              onClick={handleBookmark}
              className={`transition-colors cursor-pointer border-0 bg-transparent p-0 ${
                isBookmarked
                  ? "text-moboxd-accent"
                  : "text-moboxd-muted hover:text-white"
              }`}
              title="Bookmark Moment"
            >
              <i
                className={`bi bi-bookmark${
                  isBookmarked ? "-fill" : ""
                } text-xl`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          Reviews

          <span className="text-moboxd-muted text-sm font-normal">
            ({post?.reviews?.length || 0})
          </span>
        </h3>

        {/* Add Review Form */}
        {user ? (
          <form
            onSubmit={handleReviewSubmit}
            className="bg-moboxd-card border border-[#2A2A35] rounded-xl p-5 mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <textarea
                  className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-3 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent transition-colors resize-none h-24 custom-scrollbar"
                  placeholder="Add your review..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col justify-between shrink-0">
                <div>
                  <label className="text-xs font-bold text-moboxd-muted mb-2 block uppercase tracking-wider">
                    Your Rating
                  </label>

                  <div className="flex items-center gap-1 text-xl text-moboxd-accent">
                    {[1, 2, 3, 4, 5].map((star) => {
                      let iconClass = "bi-star";

                      if (reviewRating >= star) {
                        iconClass = "bi-star-fill";
                      } else if (reviewRating === star - 0.5) {
                        iconClass = "bi-star-half";
                      }

                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingClick(star)}
                          className="border-0 bg-transparent p-0 text-inherit cursor-pointer hover:scale-110 transition-transform"
                          aria-label={`Rate ${star} stars`}
                        >
                          <i className={`bi ${iconClass}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-4 sm:mt-0 bg-moboxd-accent hover:bg-yellow-400 text-black font-bold py-2 px-6 rounded-xl transition-colors disabled:opacity-50 cursor-pointer border-0"
                >
                  {submitting ? "Posting..." : "Post Review"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-6 text-center mb-8">
            <p className="text-moboxd-muted">
              <Link
                to="/login"
                className="text-moboxd-accent font-bold hover:underline"
              >
                Log in
              </Link>{" "}
              to add a review.
            </p>
          </div>
        )}

        {/* Reviews List */}
        <div className="flex flex-col gap-4">
          {!post?.reviews || post.reviews.length === 0 ? (
            <div className="text-center text-moboxd-muted py-8">
              No reviews yet. Be the first!
            </div>
          ) : (
            post.reviews.map((review) => {
              if (!review || !review._id) return null;

              const reviewUserId =
                review?.user?._id || review?.user;

              const isReviewOwner =
                user &&
                reviewUserId?.toString() ===
                  user._id?.toString();

              return (
                <div
                  key={review._id}
                  className="bg-moboxd-card border border-[#2A2A35] rounded-xl p-5 flex gap-4 relative group"
                >
                  <Link
                    to={`/profile/${
                      review?.user?.username || "unknown"
                    }`}
                    className="w-10 h-10 rounded-full bg-[#2A2A35] flex items-center justify-center overflow-hidden shrink-0 mt-1"
                  >
                    {review?.user?.profilePicture ? (
                      <img
                        src={review.user.profilePicture}
                        alt={review.user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="bi bi-person-fill text-moboxd-muted" />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <Link
                          to={`/profile/${
                            review?.user?.username || "unknown"
                          }`}
                          className="font-bold text-white hover:text-moboxd-accent transition-colors"
                        >
                          {review?.user?.username || "Unknown User"}
                        </Link>

                        <div className="flex text-moboxd-accent text-sm">
                          {[...Array(5)].map((_, i) => {
                            let iconClass = "bi-star";
                            const rating = review?.rating || 0;

                            if (rating >= i + 1) {
                              iconClass = "bi-star-fill";
                            } else if (rating >= i + 0.5) {
                              iconClass = "bi-star-half";
                            }

                            return (
                              <i
                                key={i}
                                className={`bi ${iconClass}`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {isReviewOwner && (
                        <button
                          onClick={() =>
                            handleDeleteReview(review._id)
                          }
                          className="text-moboxd-muted hover:text-red-500 transition-colors cursor-pointer border-0 bg-transparent p-1 shrink-0"
                          title="Delete Review"
                        >
                          <i className="bi bi-trash3-fill" />
                        </button>
                      )}
                    </div>

                    {review?.comment && (
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
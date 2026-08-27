import { Link } from "react-router-dom";

const PostCard = ({
  post,
  user,
  isLiked,
  isBookmarked,
  likeLoading = false,
  bookmarkLoading = false,
  onLike,
  onBookmark,
  onShare,
}) => {
  const title = post?.title?.trim() || "";
  const caption = post?.caption?.trim() || "";

  const authorUsername =
    post?.author?.username || "Unknown User";

  const authorProfilePicture =
    post?.author?.profilePicture || null;

  const category =
    post?.category || "Other";

  const authorRating =
    Number(post?.authorRating || 0);

  return (
    <article className="bg-moboxd-card rounded-2xl overflow-hidden mb-8 border border-[#2A2A35] shadow-lg">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/profile/${authorUsername}`}
            className="w-10 h-10 rounded-full bg-[#2A2A35] flex items-center justify-center overflow-hidden shrink-0"
          >
            {authorProfilePicture ? (
              <img
                src={authorProfilePicture}
                alt={authorUsername}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <i className="bi bi-person-fill text-moboxd-muted" />
            )}
          </Link>

          <Link
            to={`/profile/${authorUsername}`}
            className="font-bold text-white hover:text-moboxd-accent transition-colors truncate"
          >
            {authorUsername}
          </Link>
        </div>

        <span className="text-xs font-bold px-3 py-1 bg-[#2A2A35] rounded-full text-moboxd-muted uppercase tracking-wider shrink-0 ml-3">
          {category}
        </span>
      </div>

      {/* =====================================================
          IMAGE
      ===================================================== */}

      <Link
        to={`/posts/${post._id}`}
        className="block"
      >
        <img
          src={post.imageUrl}
          alt={
            title ||
            caption ||
            category ||
            "MoBoxd moment"
          }
          className="w-full aspect-[4/5] object-cover"
          loading="lazy"
        />
      </Link>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="px-4 pt-4 pb-3">
        {/* Title */}

        {title && (
          <Link
            to={`/posts/${post._id}`}
            className="block text-white text-xl font-bold leading-tight truncate hover:text-moboxd-accent transition-colors mb-1"
            title={title}
          >
            {title}
          </Link>
        )}

        {/* Caption */}
        {caption && (
          <p
            className={`text-moboxd-muted text-[15px] leading-6 truncate ${
              title ? "" : "text-white"
            }`}
            title={caption}
          >
            {caption}
          </p>
        )}

        {/* ===================================================
            AUTHOR RATING
        =================================================== */}

        <div className="flex items-center gap-2 mt-4">
          <span className="text-[11px] text-moboxd-muted uppercase tracking-wider font-bold mr-1">
            Author Rating
          </span>

          <div className="flex items-center text-moboxd-accent text-sm">
            {[1, 2, 3, 4, 5].map((star) => {
              let iconClass = "bi-star";

              if (authorRating >= star) {
                iconClass = "bi-star-fill";
              } else if (
                authorRating >= star - 0.5
              ) {
                iconClass = "bi-star-half";
              }

              return (
                <i
                  key={star}
                  className={`bi ${iconClass}`}
                />
              );
            })}
          </div>

          <span className="font-bold text-white text-sm">
            {authorRating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="px-4 py-3 border-t border-[#2A2A35] flex items-center justify-between">
        {/* LEFT */}

        <div className="flex items-center gap-6">
          {/* Like */}

          <button
            disabled={likeLoading}
            onClick={(e) =>
              onLike(e, post._id)
            }
            className="flex items-center gap-2 group transition-colors focus:outline-none disabled:opacity-50"
            title={
              isLiked
                ? "Unlike"
                : "Like"
            }
          >
            {likeLoading ? (
              <div className="w-4 h-4 border-2 border-moboxd-muted border-t-transparent rounded-full animate-spin" />
            ) : (
              <i
                className={`bi bi-heart${
                  isLiked
                    ? "-fill text-red-500"
                    : " text-moboxd-muted group-hover:text-red-500"
                }`}
              />
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

          {/* Comments */}

          <Link
            to={`/posts/${post._id}`}
            className="flex items-center gap-2 group transition-colors"
            title="Comments"
          >
            <i className="bi bi-chat text-moboxd-muted group-hover:text-white" />

            <span className="text-moboxd-muted group-hover:text-white font-medium">
              {post.totalReviews || 0}
            </span>
          </Link>
        </div>

        {/* RIGHT */}

        <div className="flex items-center gap-5">
          {/* Share */}

          <button
            onClick={(e) =>
              onShare(
                e,
                post._id,
                authorUsername,
              )
            }
            className="group transition-colors focus:outline-none flex items-center"
            title="Share"
          >
            <i className="text-lg bi bi-share text-moboxd-muted group-hover:text-white" />
          </button>

          {/* Bookmark */}

          <button
            disabled={bookmarkLoading}
            onClick={(e) =>
              onBookmark(
                e,
                post._id,
              )
            }
            className="group transition-colors focus:outline-none flex items-center disabled:opacity-50"
            title={
              isBookmarked
                ? "Remove bookmark"
                : "Bookmark"
            }
          >
            {bookmarkLoading ? (
              <div className="w-4 h-4 border-2 border-moboxd-muted border-t-transparent rounded-full animate-spin" />
            ) : (
              <i
                className={`text-lg bi ${
                  isBookmarked
                    ? "bi-bookmark-fill text-moboxd-accent"
                    : "bi-bookmark text-moboxd-muted group-hover:text-white"
                }`}
              />
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
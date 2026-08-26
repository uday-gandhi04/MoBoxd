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
  const title = post.title?.trim();

  return (
    <div className="bg-moboxd-card rounded-2xl overflow-hidden mb-8 border border-[#2A2A35] shadow-lg">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/profile/${post.author.username}`}
            className="w-10 h-10 rounded-full bg-[#2A2A35] flex items-center justify-center overflow-hidden"
          >
            {post.author?.profilePicture ? (
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

      {/* =====================================================
          IMAGE
      ===================================================== */}

      <Link
        to={`/posts/${post._id}`}
        className="block"
      >
        <img
          src={post.imageUrl}
          alt={title || post.category || "MoBoxd moment"}
          className="w-full aspect-[4/5] object-cover"
          loading="lazy"
        />
      </Link>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="p-4">
        {/* New posts have titles.
            Old posts can legitimately have no title. */}

        {title && (
          <Link
            to={`/posts/${post._id}`}
            className="block text-white text-xl font-bold mb-2 hover:text-moboxd-accent transition-colors"
          >
            {title}
          </Link>
        )}

        {post.caption && (
          <p className="text-white mb-4 text-lg whitespace-pre-wrap">
            {post.caption}
          </p>
        )}

        {/* =================================================
            TAGS
        ================================================= */}

        {Array.isArray(post.tags) &&
          post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-moboxd-accent bg-moboxd-accent/10 border border-moboxd-accent/20 rounded-full px-2.5 py-1"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

        {/* =================================================
            RELATED ITEM
        ================================================= */}

        {post.relatedItem?.url && (
          <a
            href={post.relatedItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[#1A1A21] border border-[#2A2A35] text-sm text-white hover:border-moboxd-accent hover:text-moboxd-accent transition-colors"
          >
            <i
              className={
                post.relatedItem.type === "PLACE"
                  ? "bi bi-geo-alt"
                  : post.relatedItem.type === "MUSIC"
                    ? "bi bi-music-note-beamed"
                    : post.relatedItem.type === "MOVIE_TV"
                      ? "bi bi-film"
                      : post.relatedItem.type === "BOOK"
                        ? "bi bi-book"
                        : post.relatedItem.type === "GAME"
                          ? "bi bi-controller"
                          : post.relatedItem.type === "PRODUCT"
                            ? "bi bi-bag"
                            : "bi bi-link-45deg"
              }
            />

            <span>
              {post.relatedItem.type === "PLACE"
                ? "Related Place"
                : post.relatedItem.type === "MUSIC"
                  ? "Related Music"
                  : post.relatedItem.type === "MOVIE_TV"
                    ? "Related Movie / TV"
                    : post.relatedItem.type === "BOOK"
                      ? "Related Book"
                      : post.relatedItem.type === "GAME"
                        ? "Related Game"
                        : post.relatedItem.type === "PRODUCT"
                          ? "Related Product"
                          : post.relatedItem.type === "ARTICLE"
                            ? "Related Article"
                            : "Related Link"}
            </span>

            <i className="bi bi-box-arrow-up-right text-xs"></i>
          </a>
        )}

        {/* =================================================
            AUTHOR RATING
        ================================================= */}

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-moboxd-muted uppercase tracking-wider font-bold me-2">
            Author Rating
          </span>

          <div className="flex text-moboxd-accent text-sm">
            {[1, 2, 3, 4, 5].map((star) => {
              const rating = Number(
                post.authorRating || 0,
              );

              let iconClass = "bi-star";

              if (rating >= star) {
                iconClass = "bi-star-fill";
              } else if (rating >= star - 0.5) {
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

          <span className="font-bold text-white ms-1">
            {Number(post.authorRating || 0).toFixed(1)}
          </span>
        </div>
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="px-4 py-3 border-t border-[#2A2A35] flex items-center justify-between">
        {/* LEFT */}

        <div className="flex items-center gap-6">
          <button
            disabled={likeLoading}
            onClick={(e) => onLike(e, post._id)}
            className="flex items-center gap-2 group transition-colors focus:outline-none disabled:opacity-50"
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

          <Link
            to={`/posts/${post._id}`}
            className="flex items-center gap-2 group transition-colors"
          >
            <i className="bi bi-chat text-moboxd-muted group-hover:text-white" />

            <span className="text-moboxd-muted group-hover:text-white font-medium">
              {post.totalReviews || 0}
            </span>
          </Link>
        </div>

        {/* RIGHT */}

        <div className="flex items-center gap-5">
          <button
            onClick={(e) =>
              onShare(
                e,
                post._id,
                post.author.username,
              )
            }
            className="group transition-colors focus:outline-none flex items-center"
            title="Share"
          >
            <i className="text-lg bi bi-share text-moboxd-muted group-hover:text-white" />
          </button>

          <button
            disabled={bookmarkLoading}
            onClick={(e) =>
              onBookmark(e, post._id)
            }
            className="group transition-colors focus:outline-none flex items-center disabled:opacity-50"
            title={isBookmarked ? "Unsave" : "Save"}
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
    </div>
  );
};

export default PostCard;
import PostCard from "./PostCard";
import FeedSkeleton from "./FeedSkeleton";

const PostFeed = ({
  posts = [],
  loading = false,
  user,
  bookmarkedIds = new Set(),
  likeLoading = {},
  bookmarkLoading = {},
  onLike,
  onBookmark,
  onShare,
  emptyMessage = "No moments found.",
}) => {
  if (loading) {
    return <FeedSkeleton />;
  }

  if (!posts.length) {
    return (
      <div className="text-center text-moboxd-muted mt-20 px-4">
        <i className="bi bi-inbox text-5xl mb-4 block" />

        <h5 className="text-xl font-bold text-white mb-2">
          No moments found
        </h5>

        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          user={user}
          isLiked={
            !!user &&
            post.likes?.some(
              (id) =>
                String(id) === String(user._id),
            )
          }
          isBookmarked={bookmarkedIds.has(
            String(post._id),
          )}
          likeLoading={
            !!likeLoading[post._id]
          }
          bookmarkLoading={
            !!bookmarkLoading[post._id]
          }
          onLike={onLike}
          onBookmark={onBookmark}
          onShare={onShare}
        />
      ))}
    </>
  );
};

export default PostFeed;
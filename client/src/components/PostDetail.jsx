import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Review form state
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts/${id}`);
        // Safely extract the post whether the backend wraps it in { post: {...} } or sends it directly
        const fetchedPost = response.data.post || response.data;
        setPost(fetchedPost);
      } catch (err) {
        setError('Failed to load the moment.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this moment?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/posts/${id}`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        navigate('/');
      } catch (err) {
        alert('Failed to delete post.');
      }
    }
  };

  const handleLike = async () => {
    if (!user) return alert('Please log in to like moments.');
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/posts/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      // Ensure we keep our unwrapped structure
      const updatedLikes = response.data.likes || response.data;
      setPost(prev => ({ ...prev, likes: updatedLikes }));
    } catch (error) {
      console.error('Error toggling like:', error);
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
    if (!user) return alert('Please log in to review.');
    
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/posts/${id}/reviews`,
        { comment: reviewText, rating: reviewRating },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      const updatedPost = response.data.post || response.data;
      setPost(updatedPost);
      setReviewText('');
      setReviewRating(5);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-moboxd-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold text-red-400 mb-4">{error}</h2>
        <button onClick={() => navigate('/')} className="text-moboxd-accent hover:underline">Return Home</button>
      </div>
    );
  }

  // Bulletproof checks for permissions and data extraction
  const isLiked = user && post?.likes?.includes(user._id);
  const isAuthor = user && post?.author && (user._id === post.author._id || user._id === post.author);
  
  const authorUsername = post?.author?.username || 'Unknown User';
  const authorProfilePic = post?.author?.profilePicture || null;
  const displayDate = post?.createdAt ? new Date(post.createdAt).toLocaleDateString() : '';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 mb-20">
      
      {/* Back Navigation */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-moboxd-muted hover:text-white transition-colors mb-6 font-medium cursor-pointer border-0 bg-transparent">
        <i className="bi bi-arrow-left"></i> Back
      </button>

      {/* Main Post Card */}
      <div className="bg-moboxd-card rounded-2xl overflow-hidden border border-[#2A2A35] shadow-2xl mb-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2A2A35]">
          <div className="flex items-center gap-4">
            <Link to={`/profile/${authorUsername}`} className="w-12 h-12 rounded-full bg-[#2A2A35] flex items-center justify-center overflow-hidden shrink-0">
              {authorProfilePic ? (
                <img src={authorProfilePic} alt={authorUsername} className="w-full h-full object-cover" />
              ) : (
                <i className="bi bi-person-fill text-moboxd-muted text-xl"></i>
              )}
            </Link>
            <div>
              <Link to={`/profile/${authorUsername}`} className="font-bold text-white text-lg hover:text-moboxd-accent transition-colors block leading-tight">
                {authorUsername}
              </Link>
              {displayDate && <span className="text-xs text-moboxd-muted">{displayDate}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {post?.category && (
              <span className="text-xs font-bold px-3 py-1 bg-[#2A2A35] rounded-full text-moboxd-muted uppercase tracking-wider">
                {post.category}
              </span>
            )}
            {isAuthor && (
              <button onClick={handleDelete} className="text-moboxd-muted hover:text-red-500 transition-colors cursor-pointer border-0 bg-transparent" title="Delete Moment">
                <i className="bi bi-trash3-fill"></i>
              </button>
            )}
          </div>
        </div>

        {/* Image (Only renders if imageUrl exists) */}
        {post?.imageUrl && (
          <div className="w-full bg-black">
            <img src={post.imageUrl} alt={post.category || 'Moment'} className="w-full max-h-[600px] object-contain" />
          </div>
        )}

        {/* Post Details */}
        <div className="p-6">
          {post?.caption && <p className="text-white text-xl mb-6">{post.caption}</p>}
          
          <div className="flex flex-wrap items-center gap-6 bg-[#1A1A21] p-4 rounded-xl border border-[#2A2A35]">
            <div className="flex flex-col">
               <span className="text-xs text-moboxd-muted uppercase tracking-wider font-bold mb-1">Author Rating</span>
               <div className="flex items-center gap-2">
                 <div className="flex text-moboxd-accent">
                   {[...Array(5)].map((_, i) => {
                     let iconClass = "bi-star";
                     const rating = post?.authorRating || 0;
                     if (rating >= i + 1) iconClass = "bi-star-fill";
                     else if (rating === i + 0.5) iconClass = "bi-star-half";
                     return <i key={i} className={`bi ${iconClass}`}></i>;
                   })}
                 </div>
                 <span className="font-bold text-white text-lg">{post?.authorRating?.toFixed(1) || '0.0'}</span>
               </div>
            </div>

            <div className="w-px h-10 bg-[#2A2A35] hidden sm:block"></div>

            <div className="flex flex-col">
               <span className="text-xs text-moboxd-muted uppercase tracking-wider font-bold mb-1">Community Avg</span>
               <div className="flex items-center gap-2">
                 <div className="flex text-moboxd-accent">
                   {[...Array(5)].map((_, i) => {
                     let iconClass = "bi-star";
                     const avgRating = post?.communityAverageRating || 0;
                     if (avgRating >= i + 1) iconClass = "bi-star-fill";
                     else if (avgRating >= i + 0.5) iconClass = "bi-star-half";
                     return <i key={i} className={`bi ${iconClass}`}></i>;
                   })}
                 </div>
                 <span className="font-bold text-white text-lg">{post?.communityAverageRating?.toFixed(1) || '0.0'}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 border-t border-[#2A2A35] flex items-center gap-8 bg-[#15151B]">
          <button onClick={handleLike} className="flex items-center gap-2 group transition-colors focus:outline-none cursor-pointer border-0 bg-transparent p-0">
            <i className={`bi bi-heart${isLiked ? '-fill text-red-500' : ' text-moboxd-muted group-hover:text-red-500'} text-xl`}></i>
            <span className={isLiked ? 'text-white font-bold' : 'text-moboxd-muted group-hover:text-white font-bold'}>
              {post?.likes?.length || 0} Likes
            </span>
          </button>
          <div className="flex items-center gap-2">
            <i className="bi bi-chat text-moboxd-muted text-xl"></i>
            <span className="text-moboxd-muted font-bold">{post?.reviews?.length || 0} Reviews</span>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          Reviews <span className="text-moboxd-muted text-sm font-normal">({post?.reviews?.length || 0})</span>
        </h3>

        {/* Add Review Form */}
        {user ? (
          <form onSubmit={handleReviewSubmit} className="bg-moboxd-card border border-[#2A2A35] rounded-xl p-5 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
               <div className="flex-1">
                 <textarea 
                   className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-3 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent transition-colors resize-none h-20 custom-scrollbar"
                   placeholder="Add your review..."
                   value={reviewText}
                   onChange={(e) => setReviewText(e.target.value)}
                   required
                 />
               </div>
               <div className="flex flex-col justify-between shrink-0">
                  <div>
                    <label className="text-xs font-bold text-moboxd-muted mb-2 block uppercase tracking-wider">Your Rating</label>
                    <div className="flex items-center gap-1 text-xl text-moboxd-accent">
                      {[1, 2, 3, 4, 5].map(star => {
                        let iconClass = "bi-star";
                        if (reviewRating >= star) iconClass = "bi-star-fill";
                        else if (reviewRating === star - 0.5) iconClass = "bi-star-half";
                        return (
                          <i 
                            key={star} 
                            className={`bi ${iconClass} cursor-pointer hover:scale-110 transition-transform`}
                            onClick={() => handleRatingClick(star)}
                          ></i>
                        );
                      })}
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="mt-3 sm:mt-0 bg-moboxd-accent hover:bg-yellow-400 text-black font-bold py-2 px-6 rounded-xl transition-colors disabled:opacity-50 cursor-pointer border-0"
                  >
                    {submitting ? 'Posting...' : 'Post Review'}
                  </button>
               </div>
            </div>
          </form>
        ) : (
          <div className="bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-6 text-center mb-8">
            <p className="text-moboxd-muted">
              <Link to="/login" className="text-moboxd-accent font-bold hover:underline">Log in</Link> to add a review.
            </p>
          </div>
        )}

        {/* Reviews List */}
        <div className="flex flex-col gap-4">
          {(!post?.reviews || post.reviews.length === 0) ? (
            <div className="text-center text-moboxd-muted py-8">No reviews yet. Be the first!</div>
          ) : (
            post.reviews.map((review) => {
              // Failsafe in case a review is somehow deleted or malformed in the DB
              if (!review || !review._id) return null;
              
              return (
                <div key={review._id} className="bg-moboxd-card border border-[#2A2A35] rounded-xl p-5 flex gap-4">
                  <Link to={`/profile/${review?.user?.username || 'unknown'}`} className="w-10 h-10 rounded-full bg-[#2A2A35] flex items-center justify-center overflow-hidden shrink-0 mt-1">
                    {review?.user?.profilePicture ? (
                      <img src={review.user.profilePicture} alt={review.user.username} className="w-full h-full object-cover" />
                    ) : (
                      <i className="bi bi-person-fill text-moboxd-muted"></i>
                    )}
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <Link to={`/profile/${review?.user?.username || 'unknown'}`} className="font-bold text-white hover:text-moboxd-accent transition-colors">
                        {review?.user?.username || 'Unknown User'}
                      </Link>
                      <div className="flex text-moboxd-accent text-sm">
                        {[...Array(5)].map((_, i) => {
                          let iconClass = "bi-star";
                          const rating = review?.rating || 0;
                          if (rating >= i + 1) iconClass = "bi-star-fill";
                          else if (rating === i + 0.5) iconClass = "bi-star-half";
                          return <i key={i} className={`bi ${iconClass}`}></i>;
                        })}
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{review?.comment}</p>
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
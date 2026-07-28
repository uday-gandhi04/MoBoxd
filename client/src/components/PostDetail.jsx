import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Add useNavigate
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';


const PostDetail = () => {
  const { id } = useParams(); // Gets the post ID from the URL
  const { user } = useContext(AuthContext);
  const navigate = useNavigate(); // Initialize navigate
  
  const [post, setPost] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/posts/${id}`);
        setPost(response.data.post);
        setReviews(response.data.reviews);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching post:', error);
        setLoading(false);
      }
    };
    fetchPostData();
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewError('');

    try {
      const response = await axios.post(
        `http://localhost:5000/api/posts/${id}/reviews`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      // Add the new review to the top of the list
      setReviews([response.data, ...reviews]);
      setComment('');
      setRating(5);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this moment? This cannot be undone.')) {
      try {
        await axios.delete(`http://localhost:5000/api/posts/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        navigate('/'); // Send them back to the feed
      } catch (err) {
        console.error('Failed to delete post:', err);
        alert(err.response?.data?.message || 'Failed to delete post');
      }
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-warning"></div></div>;
  if (!post) return <div className="text-center mt-5 text-light">Post not found.</div>;

  return (
    <div className="container mt-4 mb-5" style={{ maxWidth: '800px' }}>
      {/* Main Post Card */}
      <div className="card bg-dark text-light border-secondary shadow-lg mb-4" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
        <img 
          src={post.imageUrl} 
          alt={post.category} 
          style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} 
        />
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <div className="bg-secondary rounded-circle me-2 d-flex justify-content-center align-items-center" style={{ width: '40px', height: '40px', overflow: 'hidden' }}>
                {post.author.profilePicture ? (
                  <img src={post.author.profilePicture} alt="author" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <i className="bi bi-person-fill text-light fs-4"></i>
                )}
              </div>
              <span className="fw-bold fs-5">{post.author.username}</span>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-secondary fs-6">{post.category}</span>
              {/* Display Delete Button if logged-in user is the author */}
              {user && user._id === post.author._id && (
                <button onClick={handleDeletePost} className="btn btn-outline-danger btn-sm fw-bold">
                  <i className="bi bi-trash3-fill"></i> Delete
                </button>
              )}
            </div>
          </div>

          <p className="fs-5 mb-4">{post.caption}</p>

          <div className="row text-center border-top border-secondary pt-3">
            <div className="col-6 border-end border-secondary">
              <div className="text-secondary small text-uppercase tracking-wide">Author Rating</div>
              <div className="text-warning fs-3 fw-bold">{post.authorRating} <i className="bi bi-star-fill"></i></div>
            </div>
            <div className="col-6">
              <div className="text-secondary small text-uppercase tracking-wide">Community Avg</div>
              <div className="text-warning fs-3 fw-bold">
                {post.totalReviews > 0 ? post.communityAverageRating.toFixed(1) : '-'} <i className="bi bi-star-half"></i>
              </div>
              <div className="text-secondary small">{post.totalReviews} Reviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Submission Form */}
      {user ? (
        <div className="card bg-dark text-light border-secondary mb-4" style={{ borderRadius: '1rem' }}>
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3">Leave a Review</h5>
            {reviewError && <div className="alert alert-danger py-2">{reviewError}</div>}
            
            <form onSubmit={submitReview}>
              <div className="d-flex gap-3 mb-3">
                <div style={{ width: '120px' }}>
                  <select 
                    className="form-select bg-dark text-light border-secondary focus-ring focus-ring-warning"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  >
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  className="form-control bg-dark text-light border-secondary focus-ring focus-ring-warning" 
                  placeholder="What did you think?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-warning fw-bold text-dark px-4">Post</button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="alert alert-secondary bg-dark border-secondary text-light text-center mb-4">
          <Link to="/login" className="text-warning fw-bold text-decoration-none">Log in</Link> to leave a review.
        </div>
      )}

      {/* Reviews List */}
      <h4 className="fw-bold text-light mb-3">Reviews</h4>
      {reviews.length === 0 ? (
        <p className="text-secondary">No reviews yet. Be the first!</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {reviews.map((review) => (
            <div key={review._id} className="card bg-black text-light border-secondary">
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="fw-bold text-warning">{review.user.username}</span>
                  <span className="text-warning fw-bold small">
                    {review.rating} <i className="bi bi-star-fill"></i>
                  </span>
                </div>
                <p className="mb-0 text-light opacity-75">{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostDetail;
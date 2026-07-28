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

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ caption: '', category: '', authorRating: 5 });

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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:5000/api/posts/${id}`,
        editData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setPost(response.data); // Update the UI with the new data
      setIsEditing(false); // Close edit mode
    } catch (err) {
      console.error('Failed to update post:', err);
      alert(err.response?.data?.message || 'Failed to update post');
    }
  };

  const startEditing = () => {
    setEditData({
      caption: post?.caption || '',
      category: post?.category || 'Food',
      authorRating: post?.authorRating || 5
    });
    setIsEditing(true);
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
              {/* Hide the category badge while editing to save space */}
              {!isEditing && <span className="badge bg-secondary fs-6">{post.category}</span>}
              
              {/* Display Edit/Delete Buttons if logged-in user is the author */}
              {user && user._id === post.author._id && (
                <>
                  {isEditing ? (
                    <button onClick={() => setIsEditing(false)} className="btn btn-outline-light btn-sm fw-bold">
                      Cancel
                    </button>
                  ) : (
                    <button onClick={startEditing} className="btn btn-outline-info btn-sm fw-bold">
                      <i className="bi bi-pencil-square me-1"></i> Edit
                    </button>
                  )}
                  <button onClick={handleDeletePost} className="btn btn-outline-danger btn-sm fw-bold">
                    <i className="bi bi-trash3-fill me-1"></i> Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Conditional Rendering: Edit Form OR Display Text */}
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="mb-4 bg-black bg-opacity-25 p-3 rounded-3 border border-secondary">
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label text-secondary small">Rating</label>
                  <input 
                    type="number" 
                    className="form-control bg-dark text-light border-secondary focus-ring focus-ring-info" 
                    min="0.5" max="5" step="0.5" 
                    value={editData.authorRating}
                    onChange={(e) => setEditData({...editData, authorRating: e.target.value})}
                    required 
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small">Category</label>
                  <select 
                    className="form-select bg-dark text-light border-secondary focus-ring focus-ring-info"
                    value={editData.category}
                    onChange={(e) => setEditData({...editData, category: e.target.value})}
                  >
                    <option value="Food">🍔 Food</option>
                    <option value="Place">📍 Place</option>
                    <option value="Music">🎵 Music</option>
                    <option value="Entertainment">🎬 Entertainment</option>
                    <option value="Other">📦 Other</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label text-secondary small">Caption</label>
                <textarea 
                  className="form-control bg-dark text-light border-secondary focus-ring focus-ring-info" 
                  rows="3"
                  value={editData.caption}
                  onChange={(e) => setEditData({...editData, caption: e.target.value})}
                ></textarea>
              </div>
              <button type="submit" className="btn btn-info fw-bold w-100 text-dark">Save Changes</button>
            </form>
          ) : (
            <p className="fs-5 mb-4">{post.caption}</p>
          )}

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
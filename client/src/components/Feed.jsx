import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext); // Get logged-in user

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/posts');
        setPosts(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load moments. Is the server running?');
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleLike = async (postId) => {
    if (!user) return alert('Please log in to like moments.');

    try {
      const response = await axios.put(
        `http://localhost:5000/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Update the specific post's likes array in our local state
      setPosts(posts.map(post => 
        post._id === postId ? { ...post, likes: response.data } : post
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-warning"></div></div>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;

  return (
    <div className="container mt-4" style={{ maxWidth: '600px' }}>
      {posts.map((post) => {
        // Check if the current user has liked this post
        const isLiked = user && post.likes?.includes(user._id);

        return (
          <div key={post._id} className="card mb-4 shadow-sm bg-dark text-light border-secondary">
            <div className="card-header border-secondary d-flex align-items-center">
              <div className="bg-secondary rounded-circle me-2 d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px', overflow: 'hidden' }}>
                 {post.author.profilePicture ? (
                    <img src={post.author.profilePicture} alt="author" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="bi bi-person-fill text-light"></i>
                  )}
              </div>
              <Link to={`/profile/${post.author.username}`} className="text-light text-decoration-none fw-bold hover-warning">
                {post.author.username}
              </Link>
            </div>

            <Link to={`/posts/${post._id}`} className="text-decoration-none text-light">
              <img src={post.imageUrl} className="card-img-top" alt={post.category} style={{ maxHeight: '400px', objectFit: 'cover' }} />
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                   <span className="text-warning fs-5 fw-bold">
                     {post.authorRating} <i className="bi bi-star-fill"></i>
                   </span>
                   <span className="badge bg-secondary">{post.category}</span>
                </div>
                <p className="card-text mb-3">{post.caption}</p>
              </div>
            </Link>

            <div className="card-footer border-secondary bg-dark text-light">
              <div className="d-flex align-items-center gap-3 fs-5">
                {/* Like Button */}
                <div onClick={() => handleLike(post._id)} style={{ cursor: 'pointer' }} className="d-flex align-items-center gap-1 hover-warning">
                  {isLiked ? (
                    <i className="bi bi-heart-fill text-danger"></i>
                  ) : (
                    <i className="bi bi-heart"></i>
                  )}
                  <span className="fs-6">{post.likes?.length || 0}</span>
                </div>

                <Link to={`/posts/${post._id}`} className="text-light text-decoration-none d-flex align-items-center gap-1 hover-warning">
                  <i className="bi bi-chat"></i>
                  <span className="fs-6">{post.totalReviews}</span>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Feed;
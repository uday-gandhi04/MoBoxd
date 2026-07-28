import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/posts');
        setPosts(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-warning"></div></div>;

  return (
    <div className="container mt-4" style={{ maxWidth: '600px' }}>
      {posts.map((post) => (
        <div key={post._id} className="card mb-4 shadow-sm bg-dark text-light border-secondary">
          {/* Post Header */}
          <div className="card-header border-secondary d-flex align-items-center">
            <div className="bg-secondary rounded-circle me-2" style={{ width: '32px', height: '32px' }}></div>
            <span className="fw-bold">{post.author.username}</span>
          </div>

          {/* Wrap the image and body in a Link to the detail page */}
          <Link to={`/posts/${post._id}`} className="text-decoration-none text-light">
            {/* Post Image */}
            <img src={post.imageUrl} className="card-img-top" alt={post.category} style={{ maxHeight: '400px', objectFit: 'cover' }} />

            {/* Post Body & Letterboxd Ratings */}
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

          {/* Social Actions stay outside the link */}
          <div className="card-footer border-secondary bg-dark text-light">
            <div className="d-flex gap-3 fs-5">
              <i className="bi bi-heart" style={{ cursor: 'pointer' }}></i>
              <Link to={`/posts/${post._id}`} className="text-light">
                <i className="bi bi-chat" style={{ cursor: 'pointer' }}></i>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Feed;
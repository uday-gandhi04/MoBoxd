import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
  const { username } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/${username}`);
        setProfileUser(response.data.user);
        setUserPosts(response.data.posts);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-warning"></div></div>;
  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;
  if (!profileUser) return <div className="text-center mt-5 text-light">User not found</div>;

  return (
    <div className="container mt-4 mb-5" style={{ maxWidth: '900px' }}>
      {/* Profile Header */}
      <div className="d-flex align-items-center mb-5 pb-4 border-bottom border-secondary">
        <div className="bg-secondary rounded-circle me-4 d-flex justify-content-center align-items-center" style={{ width: '100px', height: '100px', overflow: 'hidden' }}>
          {profileUser.profilePicture ? (
            <img src={profileUser.profilePicture} alt={profileUser.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <i className="bi bi-person-fill text-light" style={{ fontSize: '4rem' }}></i>
          )}
        </div>
        <div>
          <h2 className="fw-bold text-light mb-1">{profileUser.username}</h2>
          <p className="text-secondary mb-0">{userPosts.length} Moments Boxed</p>
        </div>
      </div>

      {/* User's Posts Grid */}
      <div className="row g-4">
        {userPosts.length === 0 ? (
          <p className="text-secondary text-center">No posts yet.</p>
        ) : (
          userPosts.map((post) => (
            <div key={post._id} className="col-12 col-md-6 col-lg-4">
              <Link to={`/posts/${post._id}`} className="text-decoration-none">
                <div className="card bg-dark border-secondary h-100 text-light shadow-sm post-card-hover" style={{ borderRadius: '0.75rem', overflow: 'hidden' }}>
                  <img src={post.imageUrl} alt={post.category} className="card-img-top" style={{ height: '250px', objectFit: 'cover' }} />
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-warning fw-bold">{post.authorRating} <i className="bi bi-star-fill"></i></span>
                      <span className="badge bg-secondary">{post.category}</span>
                    </div>
                    <p className="card-text small text-truncate">{post.caption}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;
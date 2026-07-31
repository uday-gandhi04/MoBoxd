import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);

  // Fetch recent posts for the Discovery Grid when the component loads
  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/posts');
        setRecentPosts(response.data);
        setPostsLoading(false);
      } catch (error) {
        console.error('Error fetching recent posts:', error);
        setPostsLoading(false);
      }
    };
    fetchRecentPosts();
  }, []);

  // Handle the live search as the user types
  useEffect(() => {
    const fetchUsers = async () => {
      if (searchQuery.trim() === '') {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/users/search?q=${searchQuery}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    // Optional: Add a small debounce delay to avoid spamming the backend on every single keystroke
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <div className="container mt-4 mb-5" style={{ maxWidth: '900px' }}>
      {/* Search Bar */}
      <div className="card bg-dark border-secondary shadow-sm mb-4" style={{ borderRadius: '1rem' }}>
        <div className="card-body p-3 d-flex align-items-center">
          <i className="bi bi-search text-secondary fs-4 me-3 ms-2"></i>
          <input
            type="text"
            className="form-control bg-transparent border-0 text-light shadow-none fs-5 focus-ring focus-ring-dark"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Search Results (Displays only if user is typing) */}
      {searchQuery && (
        <div className="mb-5">
          <h5 className="text-secondary fw-bold mb-3">Search Results</h5>
          {loading ? (
            <div className="text-center mt-3"><div className="spinner-border text-warning spinner-border-sm"></div></div>
          ) : searchResults.length > 0 ? (
            <div className="list-group">
              {searchResults.map((user) => (
                <Link 
                  key={user._id} 
                  to={`/profile/${user.username}`} 
                  className="list-group-item list-group-item-action bg-dark text-light border-secondary d-flex align-items-center p-3"
                >
                  <div className="bg-secondary rounded-circle me-3 d-flex justify-content-center align-items-center" style={{ width: '45px', height: '45px', overflow: 'hidden' }}>
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className="bi bi-person-fill text-light fs-4"></i>
                    )}
                  </div>
                  <span className="fw-bold fs-5 hover-warning">{user.username}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="alert alert-dark border-secondary text-secondary text-center">
              No users found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Discovery Grid (Displays when search is empty) */}
      {!searchQuery && (
        <>
          <h4 className="fw-bold text-light mb-4">Discover Moments</h4>
          {postsLoading ? (
            <div className="text-center mt-5"><div className="spinner-border text-warning"></div></div>
          ) : (
            <div className="row g-3">
              {recentPosts.map((post) => (
                <div key={post._id} className="col-4">
                  <Link to={`/posts/${post._id}`}>
                    <div className="position-relative w-100 bg-secondary" style={{ paddingTop: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
                      <img 
                        src={post.imageUrl} 
                        alt={post.category} 
                        className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover hover-zoom" 
                      />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
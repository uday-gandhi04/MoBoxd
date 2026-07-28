import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const CreatePost = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Food'); // Default category
  const [authorRating, setAuthorRating] = useState(5.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Handle file selection and generate a preview URL
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select an image to upload.');
    
    setError('');
    setLoading(true);

    // We MUST use FormData when sending files over HTTP
    const formData = new FormData();
    formData.append('image', file);
    formData.append('caption', caption);
    formData.append('category', category);
    formData.append('authorRating', authorRating);

    try {
      await axios.post('http://localhost:5000/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`, // Attach the JWT for the protected route
        },
      });
      navigate('/'); // Redirect to the feed upon success
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload moment');
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card bg-dark text-light border-secondary shadow-lg" style={{ borderRadius: '1rem' }}>
            <div className="card-body p-4 p-md-5">
              <h2 className="fw-bold mb-4 text-center">Box a New Moment</h2>

              {error && <div className="alert alert-danger py-2 px-3 small rounded-3">{error}</div>}

              <form onSubmit={handleSubmit}>
                {/* Image Upload Area */}
                <div className="mb-4 text-center">
                  {previewUrl ? (
                    <div className="position-relative d-inline-block w-100 mb-3">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="img-fluid rounded-3 border border-secondary" 
                        style={{ maxHeight: '300px', objectFit: 'cover', width: '100%' }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                        onClick={() => { setFile(null); setPreviewUrl(null); }}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="border border-secondary border-2 border-dashed rounded-3 p-5 bg-black bg-opacity-25 text-secondary">
                      <i className="bi bi-camera fs-1 mb-2"></i>
                      <p className="mb-2">Select a photo for this moment</p>
                      <input 
                        className="form-control form-control-sm bg-dark text-light border-secondary w-75 mx-auto" 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange} 
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Rating and Category Row */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label text-secondary small">Your Rating</label>
                    <div className="input-group">
                      <input 
                        type="number" 
                        className="form-control bg-dark text-light border-secondary focus-ring focus-ring-warning" 
                        min="0.5" max="5" step="0.5" 
                        value={authorRating}
                        onChange={(e) => setAuthorRating(e.target.value)}
                        required 
                      />
                      <span className="input-group-text bg-warning text-dark border-secondary">
                        <i className="bi bi-star-fill"></i>
                      </span>
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label text-secondary small">Category</label>
                    <select 
                      className="form-select bg-dark text-light border-secondary focus-ring focus-ring-secondary"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Food">🍔 Food</option>
                      <option value="Place">📍 Place</option>
                      <option value="Music">🎵 Music</option>
                      <option value="Entertainment">🎬 Entertainment</option>
                      <option value="Other">📦 Other</option>
                    </select>
                  </div>
                </div>

                {/* Caption text area */}
                <div className="mb-4">
                  <label className="form-label text-secondary small">Review / Caption</label>
                  <textarea 
                    className="form-control bg-dark text-light border-secondary focus-ring focus-ring-secondary" 
                    rows="3"
                    placeholder="What did you think?"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-warning w-100 fw-bold py-2 rounded-3 text-dark"
                  disabled={loading}
                >
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Uploading...</>
                  ) : (
                    'Post Moment'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
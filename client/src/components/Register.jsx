import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '',
    confirmPassword: '', // Added confirm field
    profilePicture: ''
  });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation: Check if passwords match before hitting the backend
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      // The backend will safely ignore the confirmPassword field
      const response = await axios.post('http://localhost:5000/api/users/register', formData);
      login(response.data); 
      navigate('/'); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-5">
          <div className="card bg-dark text-light border-secondary shadow-lg" style={{ borderRadius: '1rem' }}>
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bolder tracking-wide mb-1">Join MoBoxd</h2>
                <p className="text-secondary small">Start rating your moments today.</p>
              </div>
              
              {error && <div className="alert alert-danger py-2 px-3 small rounded-3">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                  <input 
                    type="text" 
                    className="form-control bg-dark text-light border-secondary focus-ring focus-ring-secondary" 
                    id="floatingUsername"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required 
                  />
                  <label htmlFor="floatingUsername" className="text-secondary">Username</label>
                </div>

                <div className="form-floating mb-3">
                  <input 
                    type="email" 
                    className="form-control bg-dark text-light border-secondary focus-ring focus-ring-secondary" 
                    id="floatingEmail"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required 
                  />
                  <label htmlFor="floatingEmail" className="text-secondary">Email address</label>
                </div>

                <div className="form-floating mb-3">
                  <input 
                    type="url" 
                    className="form-control bg-dark text-light border-secondary focus-ring focus-ring-secondary" 
                    id="floatingPic"
                    name="profilePicture"
                    placeholder="https://..."
                    value={formData.profilePicture}
                    onChange={handleChange}
                  />
                  <label htmlFor="floatingPic" className="text-secondary">Profile Picture URL (Optional)</label>
                </div>

                <div className="form-floating mb-3">
                  <input 
                    type="password" 
                    className="form-control bg-dark text-light border-secondary focus-ring focus-ring-secondary" 
                    id="floatingPassword"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required 
                  />
                  <label htmlFor="floatingPassword" className="text-secondary">Password</label>
                </div>

                {/* Added Confirm Password Field */}
                <div className="form-floating mb-4">
                  <input 
                    type="password" 
                    className="form-control bg-dark text-light border-secondary focus-ring focus-ring-secondary" 
                    id="floatingConfirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required 
                  />
                  <label htmlFor="floatingConfirmPassword" className="text-secondary">Confirm Password</label>
                </div>

                <button type="submit" className="btn btn-warning w-100 fw-bold py-2 rounded-3 text-dark">
                  Create Account
                </button>
              </form>
              
              <div className="text-center mt-4 pt-2 border-top border-secondary">
                <span className="text-secondary small">Already have an account? </span>
                <Link to="/login" className="text-warning text-decoration-none fw-bold small">Log in</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
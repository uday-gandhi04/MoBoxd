import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/users/login', formData);
      login(response.data); 
      navigate('/'); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-5">
          <div className="card bg-dark text-light border-secondary shadow-lg" style={{ borderRadius: '1rem' }}>
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bolder tracking-wide mb-1">Welcome Back</h2>
                <p className="text-secondary small">Log in to catch up on new moments.</p>
              </div>
              
              {error && <div className="alert alert-danger py-2 px-3 small rounded-3">{error}</div>}
              
              <form onSubmit={handleSubmit}>
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

                <div className="form-floating mb-4">
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

                <button type="submit" className="btn btn-warning w-100 fw-bold py-2 rounded-3 text-dark">
                  Log In
                </button>
              </form>
              
              <div className="text-center mt-4 pt-2 border-top border-secondary">
                <span className="text-secondary small">Don't have an account? </span>
                <Link to="/register" className="text-warning text-decoration-none fw-bold small">Sign up</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
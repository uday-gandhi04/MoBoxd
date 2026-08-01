import { useState, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const EditProfileModal = ({ isOpen, onClose, profileData, onUpdateSuccess }) => {
  const { user, login } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  // Added Bio and Password states
  const [displayName, setDisplayName] = useState(profileData?.displayName || profileData?.username || '');
  const [bio, setBio] = useState(profileData?.bio || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(profileData?.profilePicture || null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate new password if the user is trying to change it
    if (password && password !== confirmPassword) {
      return setError('New passwords do not match.');
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('displayName', displayName);
    if (bio) formData.append('bio', bio);
    if (password) formData.append('password', password);
    if (imageFile) {
      formData.append('profilePicture', imageFile);
    }

    try {
      // Safely grab the ID regardless of how the AuthContext structures it
      const userId = user?._id || user?.id;

      const response = await axios.put(
        `http://localhost:5000/api/users/${userId}`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      
      const updatedUser = { ...user, ...response.data };
      login(updatedUser);
      
      onUpdateSuccess(response.data);
      setLoading(false);
      onClose();
    } catch (err) {
      console.error("Profile Update Failed:", err);
      // Fallback to the exact stringified error if the backend doesn't send a JSON message
      setError(err.response?.data?.message || err.message || 'Error updating profile. Check console for details.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-moboxd-card border border-[#2A2A35] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A35] shrink-0">
          <h2 className="text-xl font-bold text-white tracking-wide">Edit Profile</h2>
          <button onClick={onClose} className="text-moboxd-muted hover:text-white transition-colors cursor-pointer">
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-xl text-sm mb-6 text-center font-medium">{error}</div>}
          
          <form id="editProfileForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
              />
              <div 
                onClick={() => fileInputRef.current.click()}
                className="w-32 h-32 rounded-full border-2 border-dashed border-[#2A2A35] hover:border-moboxd-accent bg-[#1A1A21] flex items-center justify-center cursor-pointer overflow-hidden relative group transition-colors shadow-inner"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="bi bi-camera text-white text-2xl"></i>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-moboxd-muted">
                    <i className="bi bi-person-bounding-box text-3xl mb-2"></i>
                    <span className="text-xs font-bold uppercase tracking-wider">Upload</span>
                  </div>
                )}
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label className="text-xs font-bold text-moboxd-muted mb-2 block uppercase tracking-wider">Display Name</label>
              <input 
                type="text" 
                className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-4 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent focus:ring-1 focus:ring-moboxd-accent transition-all"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you appear to others"
                required
              />
            </div>

            {/* Bio Textarea */}
            <div>
              <label className="text-xs font-bold text-moboxd-muted mb-2 block uppercase tracking-wider">Bio</label>
              <textarea 
                className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-4 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent focus:ring-1 focus:ring-moboxd-accent transition-all resize-none h-24 custom-scrollbar"
                placeholder="Tell the community about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* Password Change Section */}
            <div className="pt-4 border-t border-[#2A2A35]">
              <h3 className="text-xs font-bold text-moboxd-muted mb-4 uppercase tracking-wider">Change Password (Optional)</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input 
                    type="password" 
                    className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-4 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent focus:ring-1 focus:ring-moboxd-accent transition-all"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength="6"
                  />
                </div>
                <div className="flex-1">
                  <input 
                    type="password" 
                    className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-4 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent focus:ring-1 focus:ring-moboxd-accent transition-all"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength="6"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2A2A35] bg-[#15151B] shrink-0">
          <button 
            type="submit" 
            form="editProfileForm"
            disabled={loading}
            className="w-full bg-moboxd-accent hover:bg-yellow-400 text-black font-extrabold text-lg py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg shadow-moboxd-accent/20"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditProfileModal;
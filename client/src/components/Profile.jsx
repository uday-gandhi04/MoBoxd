import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import EditProfileModal from "./EditProfileModal";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Read the URL to see if we should start on a specific tab
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get("tab");
  const initialTab = tabParam === "saved" ? "SAVED" : tabParam === "rankings" ? "RANKINGS" : "MOMENTS";

  const { user, setUser } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userRankings, setUserRankings] = useState([]); // NEW STATE FOR RANKINGS
  const [savedPosts, setSavedPosts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [error, setError] = useState("");

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Watch URL changes for sidebar clicks
  useEffect(() => {
    const currentParams = new URLSearchParams(location.search);
    const currentTab = currentParams.get("tab");
    if (currentTab === "saved") setActiveTab("SAVED");
    else if (currentTab === "rankings") setActiveTab("RANKINGS");
    else setActiveTab("MOMENTS");
  }, [location.search]);

  // Fetch the main profile data (User, Posts, and Rankings)
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users/${username}`,
        );
        const fetchedUser = response.data.user;

        setProfileUser(fetchedUser);
        setUserPosts(response.data.posts);
        setUserRankings(response.data.rankings || []); // SET RANKINGS HERE
        
        setFollowerCount(fetchedUser.followers?.length || 0);
        setFollowingCount(fetchedUser.following?.length || 0);

        if (user && fetchedUser.followers?.includes(user._id)) {
          setIsFollowing(true);
        } else {
          setIsFollowing(false);
        }
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, user]);

  // Fetch Saved Bookmarks independently 
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (activeTab === 'SAVED' && user && user.username === profileUser?.username) {
        setLoadingSaved(true);
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/bookmarks`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          setSavedPosts(response.data);
        } catch (err) {
          console.error("Failed to load saved posts");
        } finally {
          setLoadingSaved(false);
        }
      }
    };
    fetchBookmarks();
  }, [activeTab, user, profileUser]);

  const handleFollowToggle = async () => {
    if (!user) return alert("You must be logged in to follow users.");
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/${profileUser._id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } },
      );

      if (isFollowing) {
        setFollowerCount((prev) => prev - 1);
        setIsFollowing(false);
      } else {
        setFollowerCount((prev) => prev + 1);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-moboxd-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="text-center text-red-400 mt-20 text-xl font-bold">
        {error || "User not found"}
      </div>
    );
  }

  const displayPosts = activeTab === 'MOMENTS' ? userPosts : savedPosts;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 pb-8 border-b border-[#2A2A35]">
        {/* Avatar */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#1A1A21] flex items-center justify-center overflow-hidden border-2 border-[#2A2A35] shadow-lg shrink-0">
          {profileUser.profilePicture ? (
            <img
              src={profileUser.profilePicture}
              alt={profileUser.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <i className="bi bi-person-fill text-moboxd-muted text-6xl"></i>
          )}
        </div>

        {/* User Info & Stats */}
        <div className="flex-1 text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-wide">
                {profileUser.displayName || profileUser.username}
              </h2>
              <p className="text-moboxd-accent font-medium mt-1">
                @{profileUser.username.toLowerCase()}
              </p>
              {profileUser.bio && (
                <p className="text-gray-300 mt-3 text-sm max-w-md mx-auto md:mx-0 leading-relaxed">
                  {profileUser.bio}
                </p>
              )}
            </div>

            {/* Follow / Edit Button */}
            {user && user.username !== profileUser.username ? (
              <button
                onClick={handleFollowToggle}
                className={`px-6 py-2 rounded-xl font-bold transition-colors w-full md:w-auto ${isFollowing ? "bg-[#2A2A35] text-white hover:bg-[#3A3A45]" : "bg-moboxd-accent text-black hover:bg-yellow-400"}`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            ) : user && user.username === profileUser.username ? (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-6 py-2 rounded-xl font-bold bg-[#2A2A35] text-white hover:bg-[#3A3A45] transition-colors w-full md:w-auto cursor-pointer"
              >
                Edit Profile
              </button>
            ) : null}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12 text-center mt-6">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">
                {userPosts.length}
              </span>
              <span className="text-xs text-moboxd-muted uppercase tracking-widest">
                Moments
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">
                {userRankings.length}
              </span>
              <span className="text-xs text-moboxd-muted uppercase tracking-widest">
                Rankings
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">
                {followerCount}
              </span>
              <span className="text-xs text-moboxd-muted uppercase tracking-widest">
                Followers
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">
                {followingCount}
              </span>
              <span className="text-xs text-moboxd-muted uppercase tracking-widest">
                Following
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Tabs */}
      <div className="flex justify-center md:justify-start gap-8 mb-6 border-b border-[#2A2A35]">
        <button 
          onClick={() => {
            setActiveTab('MOMENTS');
            navigate(`/profile/${username}`);
          }}
          className={`pb-3 border-b-2 font-bold tracking-wide flex items-center gap-2 transition-colors ${activeTab === 'MOMENTS' ? 'border-moboxd-accent text-white' : 'border-transparent text-moboxd-muted hover:text-white'}`}
        >
          <i className="bi bi-grid-3x3"></i> Moments
        </button>

        <button 
          onClick={() => {
            setActiveTab('RANKINGS');
            navigate(`/profile/${username}?tab=rankings`);
          }}
          className={`pb-3 border-b-2 font-bold tracking-wide flex items-center gap-2 transition-colors ${activeTab === 'RANKINGS' ? 'border-moboxd-accent text-white' : 'border-transparent text-moboxd-muted hover:text-white'}`}
        >
          <i className="bi bi-trophy"></i> Rankings
        </button>

        {user && profileUser && user.username === profileUser.username && (
          <button 
            onClick={() => {
              setActiveTab('SAVED');
              navigate(`/profile/${username}?tab=saved`);
            }}
            className={`pb-3 border-b-2 font-bold tracking-wide flex items-center gap-2 transition-colors ${activeTab === 'SAVED' ? 'border-moboxd-accent text-white' : 'border-transparent text-moboxd-muted hover:text-white'}`}
          >
            <i className="bi bi-bookmark"></i> Saved
          </button>
        )}
      </div>

      {/* Empty States */}
      {activeTab === 'MOMENTS' && userPosts.length === 0 && (
        <div className="text-center text-moboxd-muted mt-20">
          <i className="bi bi-camera text-5xl mb-4 block"></i>
          <h5 className="text-xl font-bold text-white mb-2">No moments yet.</h5>
        </div>
      )}

      {activeTab === 'RANKINGS' && userRankings.length === 0 && (
        <div className="text-center text-moboxd-muted mt-20">
          <i className="bi bi-trophy text-5xl mb-4 block"></i>
          <h5 className="text-xl font-bold text-white mb-2">No rankings yet.</h5>
        </div>
      )}

      {activeTab === 'SAVED' && savedPosts.length === 0 && !loadingSaved && (
        <div className="text-center text-moboxd-muted mt-20">
          <i className="bi bi-bookmark-dash text-5xl mb-4 block"></i>
          <h5 className="text-xl font-bold text-white mb-2">Nothing saved yet.</h5>
          <p>Tap the bookmark icon on any post to save it for later.</p>
        </div>
      )}

      {loadingSaved && activeTab === 'SAVED' && (
        <div className="flex justify-center mt-20">
          <div className="w-8 h-8 border-4 border-moboxd-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Feed Rendering */}
      {activeTab === 'RANKINGS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userRankings.map((ranking) => (
            <Link 
              to={`/rankings/${ranking._id}`} 
              key={ranking._id} 
              className="block bg-[#1A1A21] border border-[#2A2A35] rounded-3xl p-6 hover:border-moboxd-accent transition-all"
            >
              <h3 className="text-xl font-bold text-white mb-2">{ranking.title}</h3>
              <p className="text-moboxd-muted text-sm line-clamp-2">
                {ranking.items && ranking.items.length > 0 
                  ? ranking.items.map(i => i.name).join(', ') 
                  : 'No items listed'}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        (!loadingSaved || activeTab === 'MOMENTS') && (
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {displayPosts.map((post) => (
              <Link
                key={post._id}
                to={`/posts/${post._id}`}
                className="block relative group overflow-hidden bg-[#1A1A21] rounded-sm md:rounded-xl"
              >
                <div className="aspect-square">
                  <img
                    src={post.imageUrl}
                    alt={post.category}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <i className="bi bi-heart-fill text-red-500"></i>{" "}
                    {post.likes?.length || 0}
                  </div>
                  <div className="flex items-center gap-2 text-white font-bold">
                    <i className="bi bi-chat-fill"></i> {post.totalReviews || 0}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profileData={profileUser}
        onUpdateSuccess={(updatedData) => {
          setProfileUser(prev => ({ ...prev, ...updatedData }));
          if (setUser) {
            setUser(prev => ({ ...prev, ...updatedData }));
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser) {
              localStorage.setItem('user', JSON.stringify({ ...storedUser, ...updatedData }));
            }
          }
        }}
      />
    </div>
  );
};

export default Profile;
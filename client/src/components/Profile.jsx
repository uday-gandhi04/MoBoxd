import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import EditProfileModal from "./EditProfileModal";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/users/${username}`,
        );
        const fetchedUser = response.data.user;

        setProfileUser(fetchedUser);
        setUserPosts(response.data.posts);
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

  const handleFollowToggle = async () => {
    if (!user) return alert("You must be logged in to follow users.");
    try {
      await axios.put(
        `http://localhost:5000/api/users/${profileUser._id}/follow`,
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

  // Calculate community average for the user
  const avgRating =
    userPosts.length > 0
      ? (
          userPosts.reduce((acc, post) => acc + post.authorRating, 0) /
          userPosts.length
        ).toFixed(1)
      : "0.0";

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
              {/* Display Name as the main header, falling back to username */}
              <h2 className="text-3xl font-extrabold text-white tracking-wide">
                {profileUser.displayName || profileUser.username}
              </h2>
              {/* Permanent username handle below */}
              <p className="text-moboxd-accent font-medium mt-1">
                @{profileUser.username.toLowerCase()}
              </p>
              {/* Render Bio if it exists */}
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

          {/* Average Rating Block */}
          <div className="mt-6 inline-flex items-center gap-3 bg-[#1A1A21] px-4 py-2 rounded-xl border border-[#2A2A35]">
            <span className="text-sm font-bold text-moboxd-muted uppercase tracking-wider">
              Avg Rating
            </span>
            <div className="flex text-moboxd-accent text-sm">
              {[...Array(5)].map((_, i) => (
                <i
                  key={i}
                  className={`bi bi-star${i < Math.round(avgRating) ? "-fill" : ""}`}
                ></i>
              ))}
            </div>
            <span className="font-bold text-white">{avgRating}</span>
          </div>
        </div>
      </div>

      {/* Grid Tabs */}
      <div className="flex justify-center md:justify-start gap-8 mb-6 border-b border-[#2A2A35]">
        <button className="pb-3 border-b-2 border-moboxd-accent text-white font-bold tracking-wide flex items-center gap-2">
          <i className="bi bi-grid-3x3"></i> Moments
        </button>
        <button className="pb-3 border-b-2 border-transparent text-moboxd-muted hover:text-white font-bold tracking-wide flex items-center gap-2 transition-colors">
          <i className="bi bi-bookmark"></i> Saved
        </button>
      </div>

      {/* Empty State */}
      {userPosts.length === 0 && (
        <div className="text-center text-moboxd-muted mt-20">
          <i className="bi bi-camera text-5xl mb-4 block"></i>
          <h5 className="text-xl font-bold text-white mb-2">No moments yet.</h5>
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {userPosts.map((post) => (
          <Link
            key={post._id}
            to={`/posts/${post._id}`}
            className="block relative group overflow-hidden bg-[#1A1A21] rounded-sm md:rounded-xl"
          >
            {/* Square Aspect Ratio Crop */}
            <div className="aspect-square">
              <img
                src={post.imageUrl}
                alt={post.category}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Hover Overlay */}
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
      
      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profileData={profileUser}
        onUpdateSuccess={(updatedData) => {
          setProfileUser(prev => ({ ...prev, ...updatedData }));
        }}
      />
    </div>
  );
};

export default Profile;
import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns"; // Run: npm install date-fns

const Activity = () => {
  const { user } = useContext(AuthContext);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/activity`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setActivities(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load activity feed.");
        setLoading(false);
      }
    };

    if (user) fetchActivity();
  }, [user]);

  const handleFollowBack = async (targetUserId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/${targetUserId}/follow`,
        {},
        {
          headers: { Authorization: `Bearer ${user.token}` },
        },
      );
      // Optional: You can add local state here to change the button icon
      // from "Follow Back" to a checkmark or "Following" so it feels responsive.
      alert("Followed back successfully!");
    } catch (err) {
      console.error("Failed to follow back");
    }
  };

  // Helper to render the activity text dynamically
  const renderActivityContent = (activity) => {
    const actorName = activity.actor.displayName || activity.actor.username;

    switch (activity.actionType) {
      case "LIKE":
        return (
          <span>
            <strong className="text-white hover:text-moboxd-accent transition-colors">
              {actorName}
            </strong>{" "}
            liked a moment.
          </span>
        );
      case "REVIEW":
        return (
          <span>
            <strong className="text-white hover:text-moboxd-accent transition-colors">
              {actorName}
            </strong>{" "}
            reviewed a moment.
          </span>
        );
      case "FOLLOW":
        return (
          <span>
            <strong className="text-white hover:text-moboxd-accent transition-colors">
              {actorName}
            </strong>{" "}
            started following{" "}
            <strong className="text-white">
              {activity.targetUser?._id === user._id
                ? "you"
                : activity.targetUser?.displayName ||
                  activity.targetUser?.username}
            </strong>
            .
          </span>
        );
      case "CREATE_RANKING":
        return (
          <span>
            <strong className="text-white hover:text-moboxd-accent transition-colors">
              {actorName}
            </strong>{" "}
            started a new ranking battle.
          </span>
        );
      case "SUBMIT_RANKING":
        return (
          <span>
            <strong className="text-white hover:text-moboxd-accent transition-colors">
              {actorName}
            </strong>{" "}
            locked in their ranks.
          </span>
        );
      default:
        return <span>{actorName} performed an action.</span>;
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center mt-32 text-center">
        <i className="bi bi-lock-fill text-6xl text-[#2A2A35] mb-4 block"></i>
        <h2 className="text-2xl font-bold text-white mb-2">
          Sign in to see activity
        </h2>
        <p className="text-moboxd-muted">
          Discover what your friends are sharing and reviewing.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 min-h-screen">
      <div className="border-b border-[#2A2A35] mb-6 pb-4">
        <h1 className="text-3xl font-extrabold text-white tracking-wide">
          Activity
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="w-8 h-8 border-4 border-moboxd-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-400 mt-10 font-bold">{error}</div>
      ) : activities.length === 0 ? (
        <div className="text-center text-moboxd-muted mt-20">
          <i className="bi bi-activity text-5xl mb-4 block opacity-50"></i>
          <h5 className="text-xl font-bold text-white mb-2">Quiet here.</h5>
          <p>Follow users to see their activity in your feed.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {activities.map((activity) => (
            <div
              key={activity._id}
              className="flex items-center justify-between p-4 bg-[#1A1A21] hover:bg-[#202028] border-b border-[#2A2A35] transition-colors rounded-lg group"
            >
              {/* Left Side: Avatar and Text */}
              <div className="flex items-center gap-4">
                <Link
                  to={`/profile/${activity.actor.username}`}
                  className="shrink-0"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2A2A35] bg-black">
                    {activity.actor.profilePicture ? (
                      <img
                        src={activity.actor.profilePicture}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="bi bi-person-fill text-moboxd-muted text-xl flex items-center justify-center h-full"></i>
                    )}
                  </div>
                </Link>

                <div className="flex flex-col text-sm">
                  <span className="text-moboxd-muted">
                    {renderActivityContent(activity)}
                  </span>
                  <span className="text-xs text-moboxd-muted/60 mt-1 font-medium tracking-wide">
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              {/* Right Side: Post Thumbnail / Icon */}
              <div className="shrink-0 ml-4">
                {activity.post && activity.post.imageUrl ? (
                  <Link to={`/posts/${activity.post._id}`}>
                    <div className="w-12 h-12 rounded border border-[#2A2A35] overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                      <img
                        src={activity.post.imageUrl}
                        alt="Post thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                ) : activity.ranking ? (
                  <Link to={`/rankings/${activity.ranking._id}`}>
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-moboxd-accent/10 border border-moboxd-accent/30 text-moboxd-accent">
                      <i className="bi bi-trophy-fill text-lg"></i>
                    </div>
                  </Link>
                ) : activity.actionType === "FOLLOW" ? (
                  <button
                    onClick={() => handleFollowBack(activity.actor._id)}
                    className="w-10 h-10 rounded-full bg-moboxd-accent/10 text-moboxd-accent hover:bg-moboxd-accent hover:text-black transition-colors flex items-center justify-center"
                    title="Follow Back"
                  >
                    <i className="bi bi-person-plus-fill"></i>
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Activity;

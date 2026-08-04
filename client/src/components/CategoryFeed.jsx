import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
// Note: Assuming you have a PostCard component you use for your home feed.
// If not, you can map the raw post data here just like you do in Home.jsx

const CategoryFeed = () => {
  const { categoryName } = useParams();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("MOMENTS"); // 'MOMENTS' or 'RANKINGS'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let endpoint =
          activeTab === "MOMENTS"
            ? `import.meta.env.VITE_API_URL/api/posts?category=${categoryName}`
            : `import.meta.env.VITE_API_URL/api/rankings/feed?category=${categoryName}`;

        const config =
          activeTab === "RANKINGS" && user
            ? { headers: { Authorization: `Bearer ${user.token}` } }
            : {};

        const res = await axios.get(endpoint, config);
        setData(res.data);
      } catch (error) {
        console.error("Failed to fetch category data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryName, activeTab, user]);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Category Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-white tracking-tight capitalize">
          #{categoryName}
        </h1>
        <p className="text-moboxd-muted mt-2">
          Explore moments and battles in this category.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-4 mb-8 border-b border-[#2A2A35] pb-4">
        <button
          onClick={() => setActiveTab("MOMENTS")}
          className={`px-6 py-2 rounded-full font-bold transition-all ${
            activeTab === "MOMENTS"
              ? "bg-moboxd-accent text-black"
              : "text-moboxd-muted hover:bg-[#2A2A35]"
          }`}
        >
          Moments
        </button>
        <button
          onClick={() => setActiveTab("RANKINGS")}
          className={`px-6 py-2 rounded-full font-bold transition-all ${
            activeTab === "RANKINGS"
              ? "bg-moboxd-accent text-black"
              : "text-moboxd-muted hover:bg-[#2A2A35]"
          }`}
        >
          Ranking Battles
        </button>
      </div>

      {/* Feed Content */}
      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="w-10 h-10 border-4 border-moboxd-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center text-moboxd-muted mt-20 font-bold">
          No {activeTab.toLowerCase()} found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((item) =>
            activeTab === "MOMENTS" ? (
              /* RENDER POST CARD HERE (You can copy your post rendering logic from Home.jsx) */
              <Link
                to={`/posts/${item._id}`}
                key={item._id}
                className="block bg-[#1A1A21] border border-[#2A2A35] rounded-3xl overflow-hidden hover:border-moboxd-accent transition-all"
              >
                <img
                  src={item.imageUrl}
                  alt={item.caption}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <p className="text-white font-bold mb-2">{item.caption}</p>
                  <span className="text-xs text-moboxd-muted">
                    By @{item.author.username}
                  </span>
                </div>
              </Link>
            ) : (
              /* RENDER RANKING CARD HERE */
              <Link
                to={`/rankings/${item._id}`}
                key={item._id}
                className="block bg-[#1A1A21] border border-[#2A2A35] rounded-3xl p-6 hover:border-moboxd-accent transition-all"
              >
                <h3 className="text-xl font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-moboxd-muted text-sm line-clamp-2">
                  {item.items && item.items.length > 0
                    ? item.items.map((i) => i.name).join(", ")
                    : "No items listed"}
                </p>
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryFeed;

import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const RankingsFeed = () => {
  const { user } = useContext(AuthContext);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/rankings/feed`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setRankings(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load the ranking feed.');
        setLoading(false);
      }
    };

    if (user) fetchRankings();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center mt-32">
        <div className="w-10 h-10 border-4 border-moboxd-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#2A2A35]">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Ranking Battles</h1>
          <p className="text-moboxd-muted mt-2">Discover, debate, and compare your tastes with the community.</p>
        </div>
        <Link 
          to="/rankings/new" 
          className="bg-moboxd-accent hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-moboxd-accent/20"
        >
          <i className="bi bi-plus-lg mr-2"></i> New Ranking
        </Link>
      </div>

      {error ? (
        <div className="text-center text-red-400 font-bold mt-10">{error}</div>
      ) : rankings.length === 0 ? (
        <div className="text-center text-moboxd-muted mt-20">
          <i className="bi bi-trophy text-6xl mb-4 block opacity-50"></i>
          <h2 className="text-2xl font-bold text-white mb-2">No active rankings</h2>
          <p>Be the first to start a debate!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rankings.map((ranking) => (
            <Link 
              key={ranking._id} 
              to={`/rankings/${ranking._id}`}
              className="group block bg-[#1A1A21] border border-[#2A2A35] hover:border-moboxd-accent rounded-3xl p-6 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-moboxd-accent bg-moboxd-accent/10 px-3 py-1 rounded-full">
                  {ranking.category}
                </span>
                <span className="text-xs text-moboxd-muted font-medium">
                  {formatDistanceToNow(new Date(ranking.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-moboxd-accent transition-colors">
                {ranking.title}
              </h3>
              
              <p className="text-moboxd-muted text-sm line-clamp-2 mb-6">
                {ranking.items.map(i => i.name).join(', ')}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[#2A2A35]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black overflow-hidden border border-[#2A2A35]">
                    {ranking.creator.profilePicture ? (
                      <img src={ranking.creator.profilePicture} alt="creator" className="w-full h-full object-cover" />
                    ) : (
                      <i className="bi bi-person-fill text-moboxd-muted flex items-center justify-center h-full"></i>
                    )}
                  </div>
                  <span className="text-sm font-bold text-white">@{ranking.creator.username}</span>
                </div>
                
                <div className="text-sm font-bold text-moboxd-muted flex items-center gap-2">
                  <i className="bi bi-people-fill"></i>
                  {ranking.aggregatedStats?.participantCount || 0}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RankingsFeed;
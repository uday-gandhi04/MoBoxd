import { useState, useEffect, useContext } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableItem } from './SortableItem';

const RankingArena = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [lobby, setLobby] = useState(null);
  const [items, setItems] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [consensus, setConsensus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Initialize Drag-and-Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchArenaData = async () => {
      try {
        // 1. Fetch the lobby details
        const lobbyRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/rankings/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setLobby(lobbyRes.data);
        
        // 2. Check if the user already submitted
        const subRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/rankings/${id}/my-submission`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        if (subRes.data) {
          // User already voted! Show results.
          setHasSubmitted(true);
          setConsensus(lobbyRes.data.aggregatedStats.consensus);
        } else {
          // User hasn't voted. Setup the drag-and-drop board.
          setItems(lobbyRes.data.items);
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to load arena", error);
        setLoading(false);
      }
    };

    if (user) fetchArenaData();
  }, [id, user]);

  // Handle Drag End Event
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item._id === active.id);
        const newIndex = items.findIndex(item => item._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleShare = async () => {
  const url = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Join my Ranking Battle: ${lobby.title}`,
        url: url
      });
    } catch (err) {
      console.log('Share cancelled', err);
    }
  } else {
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  }
};

const handleDeleteLobby = async () => {
  if (window.confirm("Are you sure you want to delete this entire ranking battle? This cannot be undone.")) {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/rankings/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      navigate('/rankings');
    } catch (error) {
      alert("Failed to delete lobby.");
    }
  }
};

const handleDeleteSubmission = async () => {
  if (window.confirm("Delete your ranking? You can always resubmit later.")) {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/rankings/${id}/my-submission`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // Reset the local state to show the drag-and-drop board again
      setHasSubmitted(false);
      setItems(lobby.items); 
    } catch (error) {
      alert("Failed to delete submission.");
    }
  }
};

  // Submit the final order to the backend
  const handleSubmitRanking = async () => {
    setSubmitting(true);
    
    // Format data to match our RankingSubmission schema requirement
    const rankedItems = items.map((item, index) => ({
      itemId: item._id,
      rankPosition: index + 1
    }));

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/rankings/${id}/submit`,
        { rankedItems },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Flip the UI to the results dashboard!
      setConsensus(response.data.consensus);
      setHasSubmitted(true);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit ranking");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-32">
        <div className="w-10 h-10 border-4 border-moboxd-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!lobby) return <div className="text-center mt-20 text-white font-bold">Lobby not found.</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-10 pb-8 border-b border-[#2A2A35]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-moboxd-accent text-xs font-bold uppercase tracking-widest bg-moboxd-accent/10 px-3 py-1 rounded-full mb-3 inline-block">
              {lobby.category}
            </span>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              {lobby.title}
            </h1>
            <div className="mt-3 flex items-center gap-2 text-sm text-moboxd-muted font-medium">
              Created by <span className="text-white">@{lobby.creator.username}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleShare}
              className="bg-[#1A1A21] hover:bg-[#2A2A35] border border-[#2A2A35] text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <i className="bi bi-share-fill"></i> Share
            </button>

            {/* Show Lobby Delete only if the logged-in user is the creator */}
            {user._id === lobby.creator._id && (
              <button 
                onClick={handleDeleteLobby}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
              >
                <i className="bi bi-trash3-fill"></i> Delete Lobby
              </button>
            )}
          </div>
        </div>
        {lobby.description && <p className="text-moboxd-muted mt-4">{lobby.description}</p>}
      </div>

      {hasSubmitted ? (
        /* ================= RESULTS DASHBOARD ================= */
        <div className="bg-[#0F0F13] border border-[#2A2A35] rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <i className="bi bi-trophy-fill text-moboxd-accent"></i> Community Consensus
            </h2>
            <span className="text-sm font-bold text-moboxd-muted bg-[#1A1A21] px-4 py-2 rounded-xl">
              {lobby.aggregatedStats.participantCount} Players
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {consensus.length > 0 ? (
              consensus.map((item, index) => (
                <div key={item.itemId} className="flex items-center gap-4 p-4 bg-[#1A1A21] rounded-xl border border-[#2A2A35]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-300 text-black' :
                    index === 2 ? 'bg-amber-700 text-white' :
                    'bg-[#2A2A35] text-moboxd-muted'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 text-white font-bold">{item.name}</div>
                  <div className="text-moboxd-muted text-sm font-bold">{item.totalPoints} pts</div>
                </div>
              ))
            ) : (
              <p className="text-moboxd-muted text-center py-10">Calculating results...</p>
            )}
          </div>

          {/* Retract Ranking Button */}
          <div className="mt-8 pt-6 border-t border-[#2A2A35] text-center">
            <button 
              onClick={handleDeleteSubmission}
              className="text-moboxd-muted hover:text-white text-sm font-bold transition-colors"
            >
              <i className="bi bi-arrow-counterclockwise mr-2"></i>
              Retract my ranking & vote again
            </button>
          </div>
        </div>
      ) : (
        /* ================= DRAG AND DROP ARENA ================= */
        <div>
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-white">Rank Your Choices</h2>
              <p className="text-moboxd-muted text-sm mt-1">Drag and drop to reorder from best (1) to worst ({items.length}).</p>
            </div>
          </div>

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext 
              items={items.map(item => item._id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item, index) => (
                <SortableItem key={item._id} id={item._id} item={item} index={index} />
              ))}
            </SortableContext>
          </DndContext>

          <button 
            onClick={handleSubmitRanking}
            disabled={submitting}
            className="w-full bg-moboxd-accent hover:bg-yellow-400 text-black font-extrabold text-lg py-5 rounded-2xl transition-all active:scale-[0.98] mt-8 shadow-lg shadow-moboxd-accent/20 disabled:opacity-50"
          >
            {submitting ? 'Locking in...' : 'Lock In My Rankings'}
          </button>
        </div>
      )}
    </div>
  );
};

export default RankingArena;
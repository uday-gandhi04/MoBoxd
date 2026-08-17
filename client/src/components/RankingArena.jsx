import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

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

  // --- NEW STATE FOR TABS AND ACCORDION ---
  const [activeTab, setActiveTab] = useState('consensus'); // 'consensus' or 'participants'
  const [participantSubmissions, setParticipantSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState(null); // Tracks which accordion is open

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchArenaData = async () => {
      try {
        // Public request (works for everyone)
        const config = user
          ? {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            }
          : {};

        const lobbyRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/rankings/${id}`,
          config
        );

        setLobby(lobbyRes.data);

        // Guest users stop here
        if (!user) {
          setItems(lobbyRes.data.items);
          setLoading(false);
          return;
        }

        // Logged-in users continue normally
        const subRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/rankings/${id}/my-submission`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (subRes.data) {
          setHasSubmitted(true);
          setConsensus(lobbyRes.data.aggregatedStats.consensus);
        } else {
          setItems(lobbyRes.data.items);
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchArenaData();
  }, [id, user]);

  // --- LAZY FETCH FOR PARTICIPANTS TAB ---
  const handleTabSwitch = async (tab) => {
    setActiveTab(tab);
    
    // Only fetch if we are switching to participants and haven't fetched them yet
    if (tab === 'participants' && participantSubmissions.length === 0) {
      setLoadingSubmissions(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/rankings/${id}/submissions`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setParticipantSubmissions(res.data);
      } catch (error) {
        console.error("Failed to load participant submissions", error);
      } finally {
        setLoadingSubmissions(false);
      }
    }
  };

  // Helper function to map a raw Item ID back to its string Name for the accordion
  const getItemName = (itemId) => {
    const foundItem = lobby?.items.find(i => i._id === itemId);
    return foundItem ? foundItem.name : 'Unknown Item';
  };

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
  // 1. Default to exactly where the browser currently is (handles both local web and prod web)
  let siteUrl = window.location.origin;

  // 2. Override ONLY if running natively on a phone (fixes the Android/iOS localhost issue)
  if (Capacitor.isNativePlatform()) {
    siteUrl = import.meta.env.VITE_SITE_URL;
  }

  // Combine the correct base URL with the current page path
  const url = `${siteUrl}${window.location.pathname}${window.location.search}`;
  const shareTitle = `Join my Ranking Battle: ${lobby?.title || 'Battle'}`;

  try {
    if (Capacitor.isNativePlatform()) {
      // --- NATIVE SHARE (Android / iOS) ---
      await Share.share({
        title: shareTitle,
        text: shareTitle,
        url: url,
        dialogTitle: 'Share this Ranking Battle'
      });
    } else if (navigator.share) {
      // --- WEB SHARE (Mobile Browsers) ---
      await navigator.share({
        title: shareTitle,
        url: url
      });
    } else {
      // --- FALLBACK (Desktop Browsers) ---
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.log('Share cancelled or failed', err);
    }
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
        setHasSubmitted(false);
        setItems(lobby.items); 
        setActiveTab('consensus'); // Reset tab just in case
      } catch (error) {
        alert("Failed to delete submission.");
      }
    }
  };

  const handleSubmitRanking = async () => {
    setSubmitting(true);
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

  // Guest trying to open a non-public ranking
  if (
    !user &&
    lobby &&
    (lobby.visibility === "FOLLOWERS" ||
      lobby.visibility === "PRIVATE")
  ) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center bg-[#1A1A21] border border-[#2A2A35] rounded-3xl p-10">
        <i className="bi bi-lock-fill text-5xl text-moboxd-accent"></i>

        <h2 className="text-3xl font-bold text-white mt-6">
          Login Required
        </h2>

        <p className="text-moboxd-muted mt-4">
          This ranking can only be accessed by logged in users.
        </p>

        <button
          onClick={() =>
            navigate("/login", {
              state: { from: `/rankings/${id}` },
            })
          }
          className="mt-8 bg-moboxd-accent text-black px-6 py-3 rounded-xl font-bold"
        >
          Login
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
  
        {/* Existing Header */}
        <div className="mb-10 pb-8 border-b border-[#2A2A35]">
          <span className="text-moboxd-accent text-xs font-bold uppercase tracking-widest bg-moboxd-accent/10 px-3 py-1 rounded-full mb-3 inline-block">
            {lobby.category}
          </span>
  
          <h1 className="text-4xl font-extrabold text-white mt-3">
            {lobby.title}
          </h1>
  
          {lobby.description && (
            <p className="text-moboxd-muted mt-4">
              {lobby.description}
            </p>
          )}
        </div>
  
        <div className="bg-[#1A1A21] border border-[#2A2A35] rounded-3xl p-8">
  
          <h2 className="text-2xl text-white font-bold mb-6">
            Ranking Items
          </h2>
  
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item._id}
                className="bg-[#0F0F13] border border-[#2A2A35] rounded-xl p-4 flex gap-4"
              >
                <div className="text-moboxd-muted font-bold">
                  {index + 1}
                </div>
  
                <div className="text-white font-semibold">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
  
          <div className="mt-10 border-t border-[#2A2A35] pt-8 text-center">
  
            <i className="bi bi-person-lock text-4xl text-moboxd-accent"></i>
  
            <h3 className="text-2xl font-bold text-white mt-4">
              Want to participate?
            </h3>
  
            <p className="text-moboxd-muted mt-3">
              Log in to submit your ranking and compare it with everyone else.
            </p>
  
            <button
              onClick={() =>
                navigate("/login", {
                  state: { from: `/rankings/${id}` },
                })
              }
              className="mt-8 bg-moboxd-accent text-black px-8 py-4 rounded-xl font-bold transition-transform active:scale-95"
            >
              Login to Participate
            </button>
  
          </div>
        </div>
      </div>
    );
  }

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
          
          {/* TAB SWITCHER UI */}
          <div className="flex bg-[#1A1A21] p-1 rounded-xl mb-8">
            <button
              onClick={() => handleTabSwitch('consensus')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'consensus' 
                  ? 'bg-[#2A2A35] text-white shadow' 
                  : 'text-moboxd-muted hover:text-white'
              }`}
            >
              Global Consensus
            </button>
            <button
              onClick={() => handleTabSwitch('participants')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'participants' 
                  ? 'bg-[#2A2A35] text-white shadow' 
                  : 'text-moboxd-muted hover:text-white'
              }`}
            >
              Participant Lists
            </button>
          </div>

          {/* TAB 1: CONSENSUS */}
          {activeTab === 'consensus' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <i className="bi bi-trophy-fill text-moboxd-accent"></i> Final Results
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
            </div>
          )}

          {/* TAB 2: PARTICIPANTS ACCORDION */}
          {activeTab === 'participants' && (
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
                <i className="bi bi-people-fill text-moboxd-accent"></i> How Others Voted
              </h2>
              
              {loadingSubmissions ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-moboxd-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : participantSubmissions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {participantSubmissions.map((sub) => {
                    const isExpanded = expandedUserId === sub.userId._id;

                    return (
                      <div key={sub._id} className="bg-[#1A1A21] rounded-xl border border-[#2A2A35] overflow-hidden transition-all duration-200">
                        
                        {/* Accordion Header */}
                        <div 
                          onClick={() => setExpandedUserId(isExpanded ? null : sub.userId._id)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#202028] transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-black overflow-hidden border border-[#2A2A35]">
                              {sub.userId.profilePicture ? (
                                <img src={sub.userId.profilePicture} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <i className="bi bi-person-fill text-moboxd-muted flex items-center justify-center h-full"></i>
                              )}
                            </div>
                            <span className="text-white font-bold">@{sub.userId.username}</span>
                          </div>
                          
                          <i className={`bi bi-chevron-down text-moboxd-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                        </div>

                        {/* Accordion Body (Expanded List) */}
                        {isExpanded && (
                          <div className="p-4 border-t border-[#2A2A35] bg-[#0F0F13]">
                            <div className="flex flex-col gap-3">
                              {/* Sort their items to display exactly 1 to N */}
                              {[...sub.rankedItems]
                                .sort((a, b) => a.rankPosition - b.rankPosition)
                                .map((rankedItem, index) => (
                                  <div 
                                    key={rankedItem.itemId} 
                                    className="flex items-center gap-4 p-4 bg-[#1A1A21] rounded-xl border border-[#2A2A35]"
                                  >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                                      index === 0 ? 'bg-yellow-500 text-black' :
                                      index === 1 ? 'bg-gray-300 text-black' :
                                      index === 2 ? 'bg-amber-700 text-white' :
                                      'bg-[#2A2A35] text-moboxd-muted'
                                    }`}>
                                      {rankedItem.rankPosition}
                                    </div>
                                    <div className="flex-1 text-white font-bold">
                                      {getItemName(rankedItem.itemId)}
                                    </div>
                                  </div>
                              ))}
                            </div>
                            <div className="mt-4 text-right">
                              <Link 
                                to={`/profile/${sub.userId.username}`}
                                className="text-sm text-moboxd-accent font-bold hover:underline"
                              >
                                View Profile
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-moboxd-muted text-center py-10">No submissions found.</p>
              )}
            </div>
          )}

          {/* Retract Ranking Button (Bottom of Dashboard) */}
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
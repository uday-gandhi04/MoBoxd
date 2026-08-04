import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const CreateRanking = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [visibility, setVisibility] = useState('PUBLIC');
  
  // Start with 3 empty items by default
  const [items, setItems] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle changing a specific item's text
  const handleItemChange = (index, value) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  // Add a new empty input field
  const handleAddItem = () => {
    setItems([...items, '']);
  };

  // Remove a specific input field
  const handleRemoveItem = (index) => {
    if (items.length <= 2) return; // Enforce minimum of 2 items
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out any empty strings just in case
    const validItems = items.filter(item => item.trim() !== '');

    if (validItems.length < 2) {
      return setError('You must provide at least 2 valid items to rank.');
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/rankings`,
        {
          title,
          description,
          category,
          visibility,
          items: validItems
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Instantly redirect them to their newly created ranking arena
      navigate(`/rankings/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ranking.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-[#1A1A21] border border-[#2A2A35] rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-extrabold text-white mb-2">Create a Ranking Battle</h1>
        <p className="text-moboxd-muted mb-8">Set up the lobby and add the items you want your friends to rank.</p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Lobby Details */}
          <div>
            <label className="text-xs font-bold text-moboxd-muted mb-2 block uppercase tracking-wider">Title</label>
            <input 
              type="text" 
              className="w-full bg-[#0F0F13] border border-[#2A2A35] rounded-xl p-4 text-white focus:border-moboxd-accent focus:ring-1 focus:ring-moboxd-accent transition-all outline-none"
              placeholder="e.g., Ultimate Fast Food Chains"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required 
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-moboxd-muted mb-2 block uppercase tracking-wider">Category</label>
              <input 
                type="text" 
                className="w-full bg-[#0F0F13] border border-[#2A2A35] rounded-xl p-4 text-white focus:border-moboxd-accent transition-all outline-none"
                placeholder="e.g., Food, Movies, Games"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required 
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-moboxd-muted mb-2 block uppercase tracking-wider">Visibility</label>
              <select 
                className="w-full bg-[#0F0F13] border border-[#2A2A35] rounded-xl p-4 text-white focus:border-moboxd-accent transition-all outline-none appearance-none"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="PUBLIC">Public (Global Feed)</option>
                <option value="FOLLOWERS">Followers Only</option>
                <option value="PRIVATE">Private (Link Only)</option>
              </select>
            </div>
          </div>

          <div className="my-4 border-b border-[#2A2A35]"></div>

          {/* Dynamic Items List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-bold text-moboxd-muted uppercase tracking-wider">The Contenders (Items to Rank)</label>
              <span className="text-xs font-bold text-moboxd-accent bg-moboxd-accent/10 px-2 py-1 rounded">{items.length} Items</span>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2A2A35] text-moboxd-muted flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </div>
                  <input 
                    type="text" 
                    className="flex-1 bg-[#0F0F13] border border-[#2A2A35] rounded-xl p-4 text-white focus:border-moboxd-accent transition-all outline-none"
                    placeholder={`Item ${index + 1}`}
                    value={item}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length <= 2}
                    className="w-12 h-12 rounded-xl border border-[#2A2A35] hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-colors flex items-center justify-center text-moboxd-muted disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-moboxd-muted disabled:hover:border-[#2A2A35]"
                  >
                    <i className="bi bi-trash3-fill"></i>
                  </button>
                </div>
              ))}
            </div>

            <button 
              type="button" 
              onClick={handleAddItem}
              className="mt-4 w-full py-4 border-2 border-dashed border-[#2A2A35] rounded-xl text-moboxd-muted font-bold hover:border-moboxd-accent hover:text-moboxd-accent transition-colors flex items-center justify-center gap-2"
            >
              <i className="bi bi-plus-lg"></i> Add Another Item
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-moboxd-accent hover:bg-yellow-400 text-black font-extrabold text-lg py-4 rounded-xl transition-all active:scale-[0.98] mt-4 disabled:opacity-50"
          >
            {loading ? 'Creating Lobby...' : 'Create Ranking Battle'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRanking;
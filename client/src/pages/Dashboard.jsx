import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [scores, setScores] = useState([]);
  const [winnings, setWinnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newScore, setNewScore] = useState('');
  const [addingScore, setAddingScore] = useState(false);
  const [uploadingWinId, setUploadingWinId] = useState(null);
  const [charities, setCharities] = useState([]);
  const [isEditingCharity, setIsEditingCharity] = useState(false);
  const [editCharityData, setEditCharityData] = useState({ charity_id: '', contribution_percentage: 10 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [meRes, charRes] = await Promise.all([
            api.get('/users/me'),
            api.get('/charities').catch(() => ({ data: { data: [] } }))
        ]);
        setUser(meRes.data.user);
        setScores(meRes.data.scores || []);
        setWinnings(meRes.data.winnings || []);
        setCharities(charRes.data.data || []);
        setEditCharityData({
            charity_id: meRes.data.user?.charity_id || '',
            contribution_percentage: meRes.data.user?.contribution_percentage || 10
        });
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (!localStorage.getItem('token')) {
        navigate('/login');
    } else {
        fetchDashboardData();
    }
  }, [navigate]);

  const handleStripeCheckout = async () => {
      try {
          // Obtain Stripe Session URL from backend
          const res = await api.post('/subscriptions/create-subscription', { planId: 'monthly' });
          if (res.data.url) {
              window.location.href = res.data.url;
          } else {
              throw new Error('No checkout URL received');
          }
      } catch(err) {
          console.log("Real API keys missing or error. Falling back to simulation mode for dev.");
          await api.post('/subscriptions/simulate-success', { plan: 'monthly' });
          setUser({...user, subscription_status: 'active'});
          alert('Simulation Enabled: Missing API keys. Subscription mocked successfully locally.');
      }
  };

  const handleAddScore = async (e) => {
      e.preventDefault();
      if(!newScore) return;
      setAddingScore(true);
      try {
          const res = await api.post('/scores', { score: parseInt(newScore) });
          setScores(res.data.scores);
          setNewScore('');
      } catch(err) {
          alert(err.response?.data?.message || 'Error adding score');
      } finally {
          setAddingScore(false);
      }
  };

  const handleUploadProof = async (winId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('proof_image', file);

    setUploadingWinId(winId);
    try {
        await api.post(`/draws/winners/${winId}/upload-proof`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Proof uploaded successfully! Awaiting Admin verification.');
        // Refresh dashboard
        const res = await api.get('/users/me');
        setWinnings(res.data.winnings || []);
    } catch(err) {
        alert(err.response?.data?.message || 'Error uploading proof');
    } finally {
        setUploadingWinId(null);
    }
  };

  const handleUpdateCharity = async (e) => {
      e.preventDefault();
      try {
          await api.put('/users/profile', editCharityData);
          const res = await api.get('/users/me');
          setUser(res.data.user);
          setIsEditingCharity(false);
          alert('Charity preferences updated!');
      } catch (err) {
          alert(err.response?.data?.message || 'Error updating charity');
      }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh] text-primary fade-in">Loading Golf Data...</div>;
  }

  return (
    <div className="py-8 fade-in h-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user?.name || 'Golfer'}</h1>
        {user?.role === 'admin' && (
            <Link to="/admin" className="btn-secondary text-sm">Go to Admin Panel</Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile & Settings Panel */}
        <div className="flex flex-col gap-8">
            <div className="glass-panel p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>
            <h2 className="text-xl font-bold border-b border-surfaceBorder pb-4 mb-4 relative z-10">Subscription</h2>
            <div className="flex flex-col gap-2 mb-4 relative z-10">
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-surfaceBorder">
                    <span className="text-text-muted text-sm">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${user?.subscription_status === 'active' ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(52,211,153,0.2)]' : 'bg-red-500/20 text-red-500'}`}>
                    {user?.subscription_status?.toUpperCase() || 'INACTIVE'}
                    </span>
                </div>
            </div>
            {user?.subscription_status !== 'active' && (
                <button onClick={handleStripeCheckout} className="btn-primary w-full mt-2 text-sm py-3 relative z-10">
                    Subscribe with Stripe ($10/mo)
                </button>
            )}
            </div>

            <div className="glass-panel p-6 border-primary/20 transition-all">
                <div className="flex justify-between items-center border-b border-surfaceBorder pb-4 mb-4">
                    <h2 className="text-xl font-bold">Supported Charity</h2>
                    {user?.subscription_status === 'active' && !isEditingCharity && (
                        <button onClick={() => setIsEditingCharity(true)} className="text-xs text-primary hover:underline font-bold">Edit</button>
                    )}
                </div>

                {user?.subscription_status !== 'active' ? (
                    <p className="text-sm text-text-muted italic">Subscribe to unlock charity contributions!</p>
                ) : isEditingCharity ? (
                    <form onSubmit={handleUpdateCharity} className="flex flex-col gap-4 fade-in">
                        <div>
                            <label className="text-xs font-bold text-text-muted mb-1 block">Select Charity</label>
                            <select className="input-field py-2 text-sm" value={editCharityData.charity_id} onChange={e => setEditCharityData({...editCharityData, charity_id: e.target.value})} required>
                                <option value="">-- Choose --</option>
                                {charities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-text-muted mb-1 block">Contribution ({editCharityData.contribution_percentage}%)</label>
                            <input type="range" min="10" max="100" className="w-full accent-primary" value={editCharityData.contribution_percentage} onChange={e => setEditCharityData({...editCharityData, contribution_percentage: e.target.value})} />
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button type="submit" className="btn-primary flex-1 py-2 text-sm">Save</button>
                            <button type="button" onClick={() => setIsEditingCharity(false)} className="btn-secondary flex-1 py-2 text-sm bg-surfaceBorder/50">Cancel</button>
                        </div>
                    </form>
                ) : user?.charity ? (
                    <div className="flex items-center gap-4 fade-in">
                        {user.charity.image_url ? 
                            <img src={user.charity.image_url} alt="Charity" className="w-12 h-12 rounded-full object-cover border border-surfaceBorder"/>
                            : <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">NGO</div>
                        }
                        <div>
                            <p className="font-semibold">{user.charity.name}</p>
                            <p className="text-sm text-primary font-bold mt-1">{user.contribution_percentage}% Contribution</p>
                        </div>
                    </div>
                ) : (
                    <div className="fade-in">
                        <p className="text-sm text-yellow-500 font-bold mb-2">⚠ Action Required</p>
                        <p className="text-sm text-text-muted">You haven't selected a charity yet. Please edit to choose where your subscription funds go!</p>
                    </div>
                )}
            </div>

            {winnings.length > 0 && (
                <div className="glass-panel p-6 border-primary/50">
                    <h2 className="text-xl font-bold border-b border-surfaceBorder pb-4 mb-4 text-primary-light">Your Winnings 🏆</h2>
                    <div className="flex flex-col gap-4">
                        {winnings.map(win => (
                            <div key={win.id} className="p-4 rounded-xl bg-black/20 border border-surfaceBorder">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-lg">${win.prize_amount}</span>
                                    <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase ${win.status === 'paid' ? 'bg-green-500/20 text-green-500' : win.status === 'approved' ? 'bg-blue-500/20 text-blue-500' : win.status === 'rejected' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                        {win.status}
                                    </span>
                                </div>
                                <p className="text-xs text-text-muted mb-3">You matched {win.match_type} numbers!</p>
                                
                                {win.status === 'pending' && !win.proof_url && (
                                    <div className="mt-2 border-t border-surfaceBorder pt-3">
                                        <p className="text-xs text-text-muted mb-2">Action Required: Upload screenshot of score proof to claim</p>
                                        <label className="btn-secondary w-full text-center flex items-center justify-center cursor-pointer disabled:opacity-50">
                                            {uploadingWinId === win.id ? 'Uploading...' : 'Upload Image Proof'}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadProof(win.id, e)} disabled={uploadingWinId === win.id} />
                                        </label>
                                    </div>
                                )}
                                {win.proof_url && win.status === 'pending' && (
                                    <p className="text-xs text-green-400 mt-2 font-bold">✓ Proof uploaded. Pending verification.</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Scores Panel */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col h-full">
          <h2 className="text-xl font-bold border-b border-surfaceBorder pb-4 mb-6">
            Your Stableford Scores
            <span className="block text-sm font-normal text-text-muted mt-1">Only your last 5 scores are kept and entered into the draw.</span>
          </h2>

          <div className="flex-grow flex flex-col">
            {scores.length === 0 ? (
                <div className="flex-grow flex items-center justify-center flex-col text-center opacity-60 py-10">
                    <div className="w-16 h-16 rounded-full bg-surfaceBorder flex items-center justify-center mb-4 text-2xl mb-2">⛳</div>
                    <p>No scores logged yet.</p>
                </div>
            ) : (
                <div className="space-y-4 mb-8">
                {scores.map((score, idx) => (
                    <div key={score.id} className="flex justify-between items-center p-4 rounded-xl bg-black/20 border border-surfaceBorder hover:border-primary/30 transition-colors">
                    <div className="flex flex-col">
                        <span className="text-xs text-text-muted uppercase tracking-wider mb-1">Score #{scores.length - idx}</span>
                        <span className="text-sm font-medium">{new Date(score.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-surface shadow-inner border border-surfaceBorder">
                        <span className="font-bold text-xl text-primary">{score.score}</span>
                    </div>
                    </div>
                ))}
                </div>
            )}

            <form onSubmit={handleAddScore} className="mt-auto border-t border-surfaceBorder pt-6">
                <label className="block text-sm font-medium mb-2 text-text-main">Enter New Score (1-45)</label>
                <div className="flex gap-4">
                    <input 
                        type="number" 
                        min="1" max="45" 
                        required 
                        disabled={addingScore}
                        className="input-field max-w-[150px]" 
                        value={newScore}
                        onChange={(e) => setNewScore(e.target.value)}
                        placeholder="e.g. 36"
                    />
                    <button type="submit" className="btn-primary" disabled={addingScore}>
                        {addingScore ? 'Saving...' : 'Add Score'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

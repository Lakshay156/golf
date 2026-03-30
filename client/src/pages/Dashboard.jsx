import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newScore, setNewScore] = useState('');
  const [addingScore, setAddingScore] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/users/me');
        setUser(res.data.user);
        setScores(res.data.scores || []);
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

  const handleSimulateSubscription = async () => {
      try {
          await api.post('/subscriptions/simulate-success', { plan: 'monthly' });
          setUser({...user, subscription_status: 'active'});
          alert('Subscription activated (Simulation)!');
      } catch(err) {
          alert('Error updating subscription');
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
                <button onClick={handleSimulateSubscription} className="btn-primary w-full mt-2 text-sm py-3 relative z-10">
                    Activate Subscription ($10/mo)
                </button>
            )}
            </div>

            <div className="glass-panel p-6">
                <h2 className="text-xl font-bold border-b border-surfaceBorder pb-4 mb-4">Supported Charity</h2>
                {user?.charity ? (
                    <div className="flex items-center gap-4">
                        {user.charity.image_url && <img src={user.charity.image_url} alt="Charity" className="w-12 h-12 rounded-full object-cover border border-surfaceBorder"/>}
                        <div>
                            <p className="font-semibold">{user.charity.name}</p>
                            <p className="text-sm text-text-muted mt-1">{user.contribution_percentage}% Contribution</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-text-muted">No charity selected yet.</p>
                )}
            </div>
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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Activity, Trophy, DollarSign, Users } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [drawResult, setDrawResult] = useState(null);
  const [pendingWinners, setPendingWinners] = useState([]);
  const [users, setUsers] = useState([]);
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Draw Execution States
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');
  const [drawMethod, setDrawMethod] = useState('random');
  const [simResult, setSimResult] = useState(null);

  // Charity Form States
  const [newCharity, setNewCharity] = useState({ name: '', description: '', image_url: '' });

  const navigate = useNavigate();

  const fetchAdminData = async () => {
    try {
      const [statsRes, drawsRes, winnersRes, usersRes, charitiesRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/draws/latest'),
          api.get('/admin/winners/pending'),
          api.get('/admin/users'),
          api.get('/charities')
      ]);
      setStats(statsRes.data);
      setDrawResult(drawsRes.data.data);
      setPendingWinners(winnersRes.data.data || []);
      setUsers(usersRes.data.data || []);
      setCharities(charitiesRes.data.data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [navigate]);

  const handleSimulateDraw = async () => {
    setExecuting(true);
    setError('');
    try {
        const res = await api.post('/draws/run', { simulate: true, method: drawMethod });
        setSimResult(res.data);
    } catch(err) {
        setError(err.response?.data?.message || 'Error running simulation');
    } finally {
        setExecuting(false);
    }
  };

  const handlePublishDraw = async () => {
    if(!window.confirm('Are you sure you want to officially publish this draw? This cannot be undone.')) return;
    setExecuting(true);
    setError('');
    try {
        await api.post('/draws/run', { simulate: false, method: drawMethod });
        setSimResult(null);
        await fetchAdminData();
        alert('Draw executed and officially published!');
    } catch(err) {
        setError(err.response?.data?.message || 'Error running draw');
    } finally {
        setExecuting(false);
    }
  };

  const handleVerifyWinner = async (winId, newStatus) => {
      try {
          await api.put(`/admin/winners/${winId}/verify`, { status: newStatus });
          setPendingWinners(prev => prev.map(w => w.id === winId ? { ...w, status: newStatus } : w));
          alert(`Winner successfully marked as ${newStatus}`);
      } catch (err) {
          alert('Verification failed. ' + (err.response?.data?.message || ''));
      }
  };

  const handleAddCharity = async (e) => {
      e.preventDefault();
      try {
          await api.post('/admin/charities', newCharity);
          setNewCharity({ name: '', description: '', image_url: '' });
          await fetchAdminData();
          alert('Charity added successfully');
      } catch (err) {
          alert('Failed to add charity');
      }
  };

  const handleDeleteCharity = async (id) => {
      if(!window.confirm('Delete this charity?')) return;
      try {
          await api.delete(`/admin/charities/${id}`);
          await fetchAdminData();
      } catch (err) {
          alert('Failed to delete charity');
      }
  };

  if (loading) return <div className="flex justify-center h-[60vh] items-center text-primary">Loading Admin...</div>;

  return (
    <div className="py-8 fade-in">
      <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Admin Control Panel</h1>
      </div>

      <div className="flex gap-4 mb-8 border-b border-surfaceBorder pb-2 overflow-x-auto">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 font-bold rounded ${activeTab === 'overview' ? 'bg-primary text-background' : 'text-text-muted hover:text-text-main'}`}>Overview & Draws</button>
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-bold rounded ${activeTab === 'users' ? 'bg-primary text-background' : 'text-text-muted hover:text-text-main'}`}>User Management</button>
          <button onClick={() => setActiveTab('charities')} className={`px-4 py-2 font-bold rounded ${activeTab === 'charities' ? 'bg-primary text-background' : 'text-text-muted hover:text-text-main'}`}>Charities</button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 mb-6 rounded">{error}</div>}

      {activeTab === 'overview' && (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-panel p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-xl text-primary"><Users size={24} /></div>
                <div><p className="text-sm text-text-muted">Total Users</p><p className="text-2xl font-bold">{stats?.totalUsers || 0}</p></div>
            </div>
            <div className="glass-panel p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-xl text-primary"><Activity size={24} /></div>
                <div><p className="text-sm text-text-muted">Active Subs</p><p className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</p></div>
            </div>
            <div className="glass-panel p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-xl text-primary"><Trophy size={24} /></div>
                <div><p className="text-sm text-text-muted">Total Prize Mined</p><p className="text-2xl font-bold">${stats?.totalPrizePool || 0}</p></div>
            </div>
            <div className="glass-panel p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-xl text-primary"><DollarSign size={24} /></div>
                <div><p className="text-sm text-text-muted">Charity Est.</p><p className="text-2xl font-bold">${stats?.estimatedCharityContributions || 0}</p></div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="glass-panel p-6 col-span-1 border-primary/30">
                <h2 className="text-xl font-bold mb-4">Draw Engine</h2>
                <div className="mb-4">
                    <label className="block text-sm text-text-muted mb-2">Algorithm Method</label>
                    <select className="input-field" value={drawMethod} onChange={e => setDrawMethod(e.target.value)}>
                        <option value="random">Standard Random</option>
                        <option value="algorithmic">Algorithmic (Top 5 Frequent Scores)</option>
                    </select>
                </div>
                
                {simResult && (
                    <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg mb-4 text-sm">
                        <p className="font-bold text-primary mb-2">Simulated Results (Not Saved)</p>
                        <p>Winning Numbers: {simResult.drawNumbers.join(' - ')}</p>
                        <p>Total Winners: 5({simResult.winnersCount.match5}) 4({simResult.winnersCount.match4}) 3({simResult.winnersCount.match3})</p>
                        <p>Total Prize Pool: ${simResult.totalPrizePool}</p>
                    </div>
                )}

                <div className="flex gap-2 flex-col">
                    <button onClick={handleSimulateDraw} disabled={executing} className="btn-secondary w-full">
                        {executing ? 'Simulating...' : 'Run Simulation'}
                    </button>
                    <button onClick={handlePublishDraw} disabled={executing || !simResult} className="btn-primary w-full disabled:opacity-50 shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                        Publish Official Results
                    </button>
                </div>
            </div>

            <div className="glass-panel p-6 col-span-2">
                <h2 className="text-xl font-bold mb-4">Latest Historic Draw Statistics</h2>
                {drawResult ? (
                    <div>
                        <div className="flex justify-between border-b border-surfaceBorder pb-3 mb-3">
                            <span className="text-text-muted">Draw Date</span><span className="font-semibold">{new Date(drawResult.draw_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-surfaceBorder pb-3 mb-3">
                            <span className="text-text-muted">Winning Numbers</span>
                            <div className="flex gap-2">
                                {drawResult.numbers.map((n, i) => <span key={i} className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center font-bold text-sm">{n}</span>)}
                            </div>
                        </div>
                        <div className="flex justify-between border-b border-surfaceBorder pb-3 mb-3">
                            <span className="text-text-muted">Prize Pool</span><span className="font-semibold text-primary">${drawResult.total_prize_pool}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">Jackpot Rollover (Next Draw)</span><span className="font-semibold">${drawResult.jackpot_amount}</span>
                        </div>
                    </div>
                ) : <p className="text-text-muted text-sm">No draws executed yet.</p>}
            </div>
        </div>

        <div className="glass-panel p-6 border border-primary/20">
            <h2 className="text-xl font-bold mb-6">Winner Verifications (Pending)</h2>
            {pendingWinners.length === 0 ? <p className="text-text-muted text-sm">No pending winners.</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="text-text-muted bg-black/40 border-b border-surfaceBorder rounded-t">
                            <tr>
                                <th className="p-3">User</th><th className="p-3">Prize</th><th className="p-3">Matches</th><th className="p-3">Proof Upload</th><th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingWinners.map(win => (
                                <tr key={win.id} className="border-b border-surfaceBorder bg-black/20 hover:bg-black/40">
                                    <td className="p-3 font-medium">{win.user_name} <br/><span className="text-xs text-text-muted">{win.user_email}</span></td>
                                    <td className="p-3 text-primary font-bold">${win.prize_amount}</td>
                                    <td className="p-3">{win.match_type}</td>
                                    <td className="p-3">
                                        {win.proof_url ? <a href={win.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Uploaded Image</a> : <span className="text-text-muted text-xs italic">Awaiting Upload...</span>}
                                    </td>
                                    <td className="p-3 flex gap-2">
                                        {win.status === 'pending' ? (
                                            <>
                                                <button disabled={!win.proof_url} onClick={() => handleVerifyWinner(win.id, 'approved')} className="bg-green-600/20 text-green-500 hover:bg-green-600/40 px-3 py-1 rounded text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed">Approve</button>
                                                <button onClick={() => handleVerifyWinner(win.id, 'rejected')} className="bg-red-600/20 text-red-500 hover:bg-red-600/40 px-3 py-1 rounded text-xs font-bold transition">Reject</button>
                                            </>
                                        ) : <span className={`px-2 py-1 text-xs rounded font-bold uppercase ${win.status === 'approved' ? 'bg-blue-500/20 text-blue-500' : 'bg-red-500/20 text-red-500'}`}>{win.status}</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </>
      )}

      {activeTab === 'users' && (
      <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-6">User Management</h2>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-text-muted bg-black/40 border-b border-surfaceBorder">
                      <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Subscription</th><th className="p-3">Charity</th></tr>
                  </thead>
                  <tbody>
                      {users.map(u => (
                          <tr key={u.id} className="border-b border-surfaceBorder bg-black/20 hover:bg-black/40">
                              <td className="p-3 font-semibold">{u.name}</td>
                              <td className="p-3">{u.email}</td>
                              <td className="p-3">{u.role}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 text-xs rounded-full uppercase ${u.subscription_status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{u.subscription_status}</span>
                              </td>
                              <td className="p-3">{u.charity_name || 'None'}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
      )}

      {activeTab === 'charities' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel p-6 col-span-1 border-primary/30 h-fit">
            <h2 className="text-xl font-bold mb-4">Add Charity</h2>
            <form onSubmit={handleAddCharity} className="flex flex-col gap-4">
                <input type="text" placeholder="Charity Name" required className="input-field" value={newCharity.name} onChange={e=>setNewCharity({...newCharity, name: e.target.value})} />
                <textarea placeholder="Description" className="input-field" rows="3" value={newCharity.description} onChange={e=>setNewCharity({...newCharity, description: e.target.value})}></textarea>
                <input type="text" placeholder="Image URL" className="input-field" value={newCharity.image_url} onChange={e=>setNewCharity({...newCharity, image_url: e.target.value})} />
                <button type="submit" className="btn-primary">Add Charity</button>
            </form>
        </div>
        <div className="glass-panel p-6 col-span-2">
          <h2 className="text-xl font-bold mb-6">Listed Charities</h2>
          <div className="flex flex-col gap-4">
              {charities.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-4 bg-black/20 border border-surfaceBorder rounded-lg">
                      <div className="flex items-center gap-4">
                          {c.image_url && <img src={c.image_url} alt="Logo" className="w-10 h-10 rounded-full object-cover" />}
                          <div>
                              <p className="font-bold">{c.name}</p>
                              <p className="text-xs text-text-muted">{c.description}</p>
                          </div>
                      </div>
                      <button onClick={() => handleDeleteCharity(c.id)} className="text-red-500 hover:text-red-400 font-bold text-sm">Delete</button>
                  </div>
              ))}
          </div>
        </div>
      </div>
      )}

    </div>
  );
};

export default AdminDashboard;

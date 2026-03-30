import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Activity, Trophy, DollarSign, Users } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [drawResult, setDrawResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, drawsRes] = await Promise.all([
            api.get('/admin/stats'),
            api.get('/draws/latest')
        ]);
        setStats(statsRes.data);
        setDrawResult(drawsRes.data.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/dashboard'); // Non-admins kicked out
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [navigate]);

  const handleRunDraw = async () => {
    if(!window.confirm('Are you sure you want to execute the monthly draw?')) return;
    setExecuting(true);
    setError('');
    try {
        const res = await api.post('/draws/run');
        // Refresh stats
        const [statsRes, drawsRes] = await Promise.all([
            api.get('/admin/stats'),
            api.get('/draws/latest')
        ]);
        setStats(statsRes.data);
        setDrawResult(drawsRes.data.data);
        alert('Draw executed successfully!');
    } catch(err) {
        setError(err.response?.data?.message || 'Error running draw');
    } finally {
        setExecuting(false);
    }
  };

  if (loading) return <div className="flex justify-center h-[60vh] items-center text-primary">Loading Admin...</div>;

  return (
    <div className="py-8 fade-in">
      <h1 className="text-3xl font-bold mb-8 text-primary">Admin Control Panel</h1>
      {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 mb-6 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-xl text-primary"><Users size={24} /></div>
            <div>
                <p className="text-sm text-text-muted">Total Users</p>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-xl text-primary"><Activity size={24} /></div>
            <div>
                <p className="text-sm text-text-muted">Active Subs</p>
                <p className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</p>
            </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-xl text-primary"><Trophy size={24} /></div>
            <div>
                <p className="text-sm text-text-muted">Total Prize Mined</p>
                <p className="text-2xl font-bold">${stats?.totalPrizePool || 0}</p>
            </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-xl text-primary"><DollarSign size={24} /></div>
            <div>
                <p className="text-sm text-text-muted">Charity Est.</p>
                <p className="text-2xl font-bold">${stats?.estimatedCharityContributions || 0}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel p-6 col-span-1 border-primary/30">
            <h2 className="text-xl font-bold mb-4">Draw Execution</h2>
            <p className="text-text-muted mb-6 text-sm">Running the monthly draw distributes prize pools based on users' last 5 Stableford scores matching the randomly generated winning numbers.</p>
            <button onClick={handleRunDraw} disabled={executing} className="btn-primary w-full shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                {executing ? 'Executing...' : 'Run Monthly Draw'}
            </button>
        </div>

        <div className="glass-panel p-6 col-span-2">
            <h2 className="text-xl font-bold mb-4">Latest Draw Statistics</h2>
            {drawResult ? (
                <div>
                    <div className="flex justify-between border-b border-surfaceBorder pb-3 mb-3">
                        <span className="text-text-muted">Draw Date</span>
                        <span className="font-semibold">{new Date(drawResult.draw_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-surfaceBorder pb-3 mb-3">
                        <span className="text-text-muted">Winning Numbers</span>
                        <div className="flex gap-2">
                            {drawResult.numbers.map((n, i) => (
                                <span key={i} className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center font-bold text-sm">{n}</span>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between border-b border-surfaceBorder pb-3 mb-3">
                        <span className="text-text-muted">Prize Pool</span>
                        <span className="font-semibold text-primary">${drawResult.total_prize_pool}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-text-muted">Jackpot Rollover (Next Draw)</span>
                        <span className="font-semibold">${drawResult.jackpot_amount}</span>
                    </div>
                </div>
            ) : (
                <p className="text-text-muted text-sm">No draws executed yet.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

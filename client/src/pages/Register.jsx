import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    charity_id: '',
    contribution_percentage: 10
  });
  const [charities, setCharities] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch charities for selection
    const fetchCharities = async () => {
      try {
        const res = await api.get('/charities');
        setCharities(res.data.data);
      } catch (err) {
        // Silent catch for now if charities don't exist yet
        console.error('Failed to load charities');
      }
    };
    fetchCharities();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', formData);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center fade-in py-12">
      <div className="glass-panel p-10 w-full max-w-md animate-slide-up">
        <h2 className="text-3xl font-bold mb-2 text-center text-primary-light">Join the Club</h2>
        <p className="text-center text-text-muted mb-8">Create your account to start playing and giving.</p>
        
        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-md mb-6">{error}</div>}
        
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-main">Full Name</label>
            <input type="text" name="name" required className="input-field" value={formData.name} onChange={handleChange} placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-text-main">Email</label>
            <input type="email" name="email" required className="input-field" value={formData.email} onChange={handleChange} placeholder="golfer@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-text-main">Password</label>
            <input type="password" name="password" required className="input-field" value={formData.password} onChange={handleChange} placeholder="••••••••" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-text-main">Select Support Charity</label>
            <select name="charity_id" className="input-field" value={formData.charity_id} onChange={handleChange} required>
              <option value="">-- Choose a Charity --</option>
              {charities.length > 0 ? (
                charities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              ) : (
                <option value="temp-uuid-placeholder">General Default Charity</option>
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-text-main">Charity Contribution (%)</label>
            <p className="text-xs text-text-muted mb-2">A minimum of 10% of your subscription goes to your selected charity.</p>
            <div className="flex items-center gap-4">
              <input type="range" name="contribution_percentage" min="10" max="100" step="1" className="w-full h-2 bg-background-dark rounded-lg appearance-none cursor-pointer accent-primary" value={formData.contribution_percentage} onChange={handleChange} />
              <div className="bg-primary/20 text-primary font-bold px-3 py-1 rounded-md min-w-[3rem] text-center">
                {formData.contribution_percentage}%
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full mt-4" disabled={loading}>
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-text-muted">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Club, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  // Temporary auth mock, would preferably use context
  const isAuthenticated = !!token;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="fixed w-full z-50 glass-panel border-x-0 border-t-0 rounded-none from-surface to-background/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <Club className="h-8 w-8 text-primary shadow-primary/50 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-primary-dark">
                FairwayCause
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-text-main flex items-center gap-2 hover:text-primary transition-colors">
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-text-muted hover:text-red-400 flex items-center gap-2 transition-colors">
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-text-main hover:text-primary transition-colors px-3 py-2">
                  Login
                </Link>
                <Link to="/register" className="btn-primary py-2 px-4 shadow-none hover:shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

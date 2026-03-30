import React from 'react';
import { ArrowRight, Trophy, Heart, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="h-full pt-16 pb-20 fade-in flex flex-col items-center">
      <div className="text-center max-w-3xl mx-auto mb-16 relative">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up">
          Play Golf. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-primary-dark">Give Back.</span>
        </h1>
        <p className="text-xl text-text-muted mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          The premium platform for golfers to compete, track Stableford scores, participate in cash-prize draws, and seamlessly donate to charities.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <Link to="/register" className="btn-primary flex items-center justify-center gap-2 group">
            Start Your Membership <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#how-it-works" className="btn-secondary">
            Learn More
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
        <div className="glass-panel p-8 hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 text-primary">
            <Activity size={24} />
          </div>
          <h3 className="text-2xl font-bold mb-3">Track Scores</h3>
          <p className="text-text-muted">Log your Stableford scores. We automatically keep your top 5 latest results on the leaderboard.</p>
        </div>

        <div className="glass-panel p-8 hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 text-primary">
            <Heart size={24} />
          </div>
          <h3 className="text-2xl font-bold mb-3">Support Charities</h3>
          <p className="text-text-muted">A minimum of 10% of your subscription goes directly to your chosen charity automatically.</p>
        </div>

        <div className="glass-panel p-8 hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 text-primary">
            <Trophy size={24} />
          </div>
          <h3 className="text-2xl font-bold mb-3">Win Big</h3>
          <p className="text-text-muted">Participate in monthly draws. Match 3, 4, or 5 numbers. 40% of the pot goes to the jackpot.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;

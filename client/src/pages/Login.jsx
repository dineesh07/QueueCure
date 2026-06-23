import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Sparkles, Activity } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // Redirect if token exists
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      // Store auth
      localStorage.setItem('token', data.token);
      localStorage.setItem('shiftId', data.shiftId);
      
      // Go to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-20 z-10 bg-white relative">
        <div className="max-w-md w-full space-y-10">
          
          {/* Mobile Header / Logo (visible only on mobile/tablet) */}
          <div className="lg:hidden flex flex-col items-center text-center space-y-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <svg viewBox="0 0 380 200" className="w-28 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* CMC Logo Flower */}
                <path d="M 100 100 C 85 88 81 76 81 64 L 90 64 L 100 79 L 110 64 L 119 64 C 119 76 115 88 100 100 Z" fill="#0056b3" />
                <path d="M 100 100 C 85 112 81 124 81 136 L 90 136 L 100 121 L 110 136 L 119 136 C 119 124 115 112 100 100 Z" fill="#0056b3" />
                <path d="M 100 100 C 88 85 76 81 64 81 L 64 90 L 79 100 L 64 110 L 64 119 C 76 119 88 115 100 100 Z" fill="#0056b3" />
                <path d="M 100 100 C 112 85 124 81 136 81 L 136 90 L 121 100 L 136 110 L 136 119 C 124 119 112 115 100 100 Z" fill="#0056b3" />
                {/* Gold Swoosh */}
                <path d="M 35 135 C 65 135 85 112 107 98 C 129 84 145 80 160 80" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" fill="none" />
                {/* CMC Text */}
                <text x="180" y="125" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="800" fontSize="72" fill="#0056b3" letterSpacing="-2">CMC</text>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                CMC Hospital
              </h2>
              <p className="text-xs text-slate-500 mt-1">Live Clinic Queue Management System</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500">
              Enter your credentials to start your receptionist shift.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Receptionist Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="receptionist@queuecure.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/25 transition bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/25 transition bg-white"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 text-center font-semibold bg-rose-50 p-3 rounded-xl border border-rose-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Start Receptionist Shift</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Hint Removed */}

        </div>
      </div>

      {/* Right Column: Visual Panel */}
      <div className="hidden lg:flex w-1/2 bg-slate-50 border-l border-slate-100 relative overflow-hidden items-center justify-center p-12">
        {/* Subtle grid layout is built into global body, but we can overlay here too */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* Animated Background blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float-delay pointer-events-none"></div>
        
        <div className="max-w-xl w-full text-center space-y-12 relative z-10">
          {/* Large Logo */}
          <div className="flex justify-center">
            <svg viewBox="0 0 380 200" className="w-80 h-40 drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* CMC Logo Flower */}
              <path d="M 100 100 C 85 88 81 76 81 64 L 90 64 L 100 79 L 110 64 L 119 64 C 119 76 115 88 100 100 Z" fill="#0056b3" />
              <path d="M 100 100 C 85 112 81 124 81 136 L 90 136 L 100 121 L 110 136 L 119 136 C 119 124 115 112 100 100 Z" fill="#0056b3" />
              <path d="M 100 100 C 88 85 76 81 64 81 L 64 90 L 79 100 L 64 110 L 64 119 C 76 119 88 115 100 100 Z" fill="#0056b3" />
              <path d="M 100 100 C 112 85 124 81 136 81 L 136 90 L 121 100 L 136 110 L 136 119 C 124 119 112 115 100 100 Z" fill="#0056b3" />
              {/* Gold Swoosh */}
              <path d="M 35 135 C 65 135 85 112 107 98 C 129 84 145 80 160 80" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" fill="none" />
              {/* CMC Text */}
              <text x="180" y="125" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="800" fontSize="72" fill="#0056b3" letterSpacing="-2">CMC</text>
            </svg>
          </div>

          {/* Marketing text using reference typography */}
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
              CMC Hospital
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              Live Clinic Queue Management System
            </p>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Real-time patient tracking, estimated consultation times, and streamlined receptionist shift operations.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;

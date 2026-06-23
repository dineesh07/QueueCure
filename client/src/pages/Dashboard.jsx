import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import ShiftStats from '../components/ShiftStats';
import QueueManager from './QueueManager';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  LogOut, LayoutDashboard, Settings, Activity, 
  Clock, CheckCircle, HelpCircle, RefreshCw 
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'manage'
  const [receptionist, setReceptionist] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Logout shift summary modal state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const token = localStorage.getItem('token');
  const shiftId = localStorage.getItem('shiftId');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch receptionist data
    const fetchMe = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReceptionist(data);
        } else {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchMe();
  }, [token, navigate]);

  // Fetch shift stats
  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/shift/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Listen for socket updates to refresh stats in real-time
    socket.on('queue:stats-updated', fetchStats);
    socket.on('queue:updated', fetchStats);

    return () => {
      socket.off('queue:stats-updated');
      socket.off('queue:updated');
    };
  }, [token]);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ shiftId })
      });

      const data = await res.json();
      if (res.ok && data.shiftSummary) {
        setSummaryData(data.shiftSummary);
        setShowSummaryModal(true);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('shiftId');
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem('token');
      localStorage.removeItem('shiftId');
      navigate('/login');
    }
  };

  const closeSummaryModal = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('shiftId');
    setShowSummaryModal(false);
    navigate('/login');
  };

  if (!receptionist || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Booting Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30 text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <header className="border-b border-slate-100 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 380 200" className="w-16 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 100 100 C 85 88 81 76 81 64 L 90 64 L 100 79 L 110 64 L 119 64 C 119 76 115 88 100 100 Z" fill="#0056b3" />
            <path d="M 100 100 C 85 112 81 124 81 136 L 90 136 L 100 121 L 110 136 L 119 136 C 119 124 115 112 100 100 Z" fill="#0056b3" />
            <path d="M 100 100 C 88 85 76 81 64 81 L 64 90 L 79 100 L 64 110 L 64 119 C 76 119 88 115 100 100 Z" fill="#0056b3" />
            <path d="M 100 100 C 112 85 124 81 136 81 L 136 90 L 121 100 L 136 110 L 136 119 C 124 119 112 115 100 100 Z" fill="#0056b3" />
            <path d="M 35 135 C 65 135 85 112 107 98 C 129 84 145 80 160 80" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" fill="none" />
            <text x="180" y="125" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="800" fontSize="72" fill="#0056b3" letterSpacing="-2">CMC</text>
          </svg>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 leading-none">CMC Hospital</h1>
            <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider block mt-0.5">Live Queue Workspace</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800">{receptionist.name}</p>
            <p className="text-[10px] text-blue-600 font-bold capitalize">{receptionist.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-slate-700 hover:text-rose-600 transition cursor-pointer flex items-center gap-2 text-sm font-bold border border-slate-200/60 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout Shift</span>
          </button>
        </div>
      </header>

      {/* Workspace Tabs */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 gap-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'stats' 
                ? 'border-blue-600 text-blue-600 font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard Stats
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'manage' 
                ? 'border-blue-600 text-blue-600 font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" /> Queue Manager
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'stats' ? (
          <div className="space-y-6">
            
            {/* Shift Stats Counters */}
            {stats && (
              <ShiftStats
                completedCount={stats.completedCount}
                avgConsultTime={stats.avgConsultTime}
                skippedCount={stats.skippedCount}
              />
            )}

            {/* Visual Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Busiest Hour Chart */}
              <div className="lg:col-span-2 p-6 rounded-2xl border glass-panel space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm uppercase tracking-wider font-bold text-slate-800">Busiest Clinic Hours</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Distribution of patient inflow today.</p>
                  </div>
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                
                <div className="h-64 w-full">
                  {stats?.busiestHours ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.busiestHours}>
                        <XAxis 
                          dataKey="hour" 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            border: '1px solid rgba(0,0,0,0.06)',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#2563eb', fontSize: '12px' }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="url(#blueGradient)" 
                          radius={[4, 4, 0, 0]}
                        />
                        <defs>
                          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      No flow analysis available yet
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Queue Depths */}
              <div className="p-6 rounded-2xl border glass-panel space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm uppercase tracking-wider font-bold text-slate-800">Live Doctor Queues</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Current waiting counts per chamber.</p>
                  </div>
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>

                <div className="space-y-3">
                  {stats?.queueDepths?.map((item) => (
                    <div 
                      key={item.doctorId}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.doctorName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Active Queue Depth</p>
                      </div>
                      <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-blue-600 font-bold text-sm">
                        {item.waitingCount} Waiting
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <QueueManager token={token} receptionistId={receptionist.id} />
        )}

      </div>

      {/* Shift End Summary Modal */}
      {showSummaryModal && summaryData && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl p-8 max-w-md w-full shadow-xl relative">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Shift Completed!</h2>
              <p className="text-xs text-slate-500">Here is your shift metrics summary.</p>
            </div>

            <div className="my-6 border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 bg-slate-50">
              <div className="flex justify-between p-3.5 text-sm">
                <span className="text-slate-500">Shift Start</span>
                <span className="font-semibold text-slate-800">
                  {new Date(summaryData.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between p-3.5 text-sm">
                <span className="text-slate-500">Shift End</span>
                <span className="font-semibold text-slate-800">
                  {new Date(summaryData.shiftEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between p-3.5 text-sm">
                <span className="text-slate-500">Patients Processed</span>
                <span className="font-semibold text-emerald-600">{summaryData.patientsHandled}</span>
              </div>
              <div className="flex justify-between p-3.5 text-sm">
                <span className="text-slate-500">Skipped / No Show</span>
                <span className="font-semibold text-rose-600">{summaryData.skippedCount}</span>
              </div>
              <div className="flex justify-between p-3.5 text-sm">
                <span className="text-slate-500">Avg Consultation Time</span>
                <span className="font-semibold text-blue-600">{summaryData.avgHandleTime} mins</span>
              </div>
            </div>

            <button
              onClick={closeSummaryModal}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition cursor-pointer"
            >
              Close Summary & Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

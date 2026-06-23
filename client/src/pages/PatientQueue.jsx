import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import NotifyMe from '../components/NotifyMe';
import WaitTimeBadge from '../components/WaitTimeBadge';
import { Clock, RefreshCw, Activity, ArrowRight, Heart, Sparkles } from 'lucide-react';

const PatientQueue = () => {
  const { doctorId } = useParams();
  const [queueData, setQueueData] = useState(null);
  const [selectedMyToken, setSelectedMyToken] = useState(() => {
    return localStorage.getItem(`myToken_${doctorId}`) || '';
  });
  const [loading, setLoading] = useState(true);
  const [timeTick, setTimeTick] = useState(Date.now());

  // Periodically refresh estimated wait time calculations (every 10 seconds)
  useEffect(() => {
    const timer = setInterval(() => setTimeTick(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!doctorId) return;

    const joinRoom = () => {
      socket.emit('join:doctor', doctorId);
    };

    // Join room initially
    if (socket.connected) {
      joinRoom();
    }

    // Handle reconnect
    socket.on('connect', joinRoom);

    // Initial REST fetch
    const fetchQueueState = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/queue/${doctorId}`);
        if (response.ok) {
          const data = await response.json();
          setQueueData(data);
        }
      } catch (err) {
        console.error('Error fetching patient queue state REST:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQueueState();

    // Listen for live updates
    socket.on('queue:updated', (data) => {
      if (data.doctorId === doctorId) {
        setQueueData(data);
      }
    });

    return () => {
      socket.off('connect', joinRoom);
      socket.off('queue:updated');
    };
  }, [doctorId]);

  const handleSelectToken = (tokenVal) => {
    setSelectedMyToken(tokenVal);
    if (tokenVal) {
      localStorage.setItem(`myToken_${doctorId}`, tokenVal);
    } else {
      localStorage.removeItem(`myToken_${doctorId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Connecting to Clinic Queue...</p>
        </div>
      </div>
    );
  }

  if (!queueData) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-6 text-center font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="space-y-4 max-w-sm">
          <h2 className="text-xl font-bold text-rose-600">Queue Not Found</h2>
          <p className="text-sm text-slate-500">
            This doctor queue link seems invalid or inactive. Please consult the clinic receptionist.
          </p>
        </div>
      </div>
    );
  }

  // Calculate position metrics if patient has identified their token
  let tokensAhead = -1;
  let estimatedWait = 0;
  if (selectedMyToken && queueData.waitingList) {
    const index = queueData.waitingList.findIndex(p => p.token === Number(selectedMyToken));
    if (index !== -1) {
      tokensAhead = index;
      estimatedWait = tokensAhead * queueData.avgConsultTime;
      if (queueData.activePatient?.calledAt) {
        const calledTime = new Date(queueData.activePatient.calledAt).getTime();
        const elapsedMinutes = (Date.now() - calledTime) / 60000;
        const remainingActiveTime = Math.max(0, queueData.avgConsultTime - elapsedMinutes);
        estimatedWait = Math.round(remainingActiveTime + tokensAhead * queueData.avgConsultTime);
      }
    }
  }

  return (
    <div className="min-h-screen bg-white/70 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-between max-w-md mx-auto border-x border-slate-100/60 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Clinic Branding */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 380 200" className="w-14 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 100 100 C 85 88 81 76 81 64 L 90 64 L 100 79 L 110 64 L 119 64 C 119 76 115 88 100 100 Z" fill="#0056b3" />
            <path d="M 100 100 C 85 112 81 124 81 136 L 90 136 L 100 121 L 110 136 L 119 136 C 119 124 115 112 100 100 Z" fill="#0056b3" />
            <path d="M 100 100 C 88 85 76 81 64 81 L 64 90 L 79 100 L 64 110 L 64 119 C 76 119 88 115 100 100 Z" fill="#0056b3" />
            <path d="M 100 100 C 112 85 124 81 136 81 L 136 90 L 121 100 L 136 110 L 136 119 C 124 119 112 115 100 100 Z" fill="#0056b3" />
            <path d="M 35 135 C 65 135 85 112 107 98 C 129 84 145 80 160 80" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" fill="none" />
            <text x="180" y="125" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="800" fontSize="72" fill="#0056b3" letterSpacing="-2">CMC</text>
          </svg>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 leading-none">CMC Hospital</h2>
            <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider block mt-0.5">Live Clinic Updates</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] text-blue-600 font-bold">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
          Live Syncing
        </div>
      </header>

      {/* Main Content */}
      <main className="my-6 space-y-6 flex-1">
        
        {/* Doctor Header */}
        <div className="text-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <h1 className="text-lg font-extrabold text-slate-900">{queueData.doctorName}</h1>
          <p className="text-xs text-blue-600 font-bold">{queueData.room}</p>
        </div>

        {/* Now Serving Big Number */}
        <div className="p-8 rounded-3xl border glass-panel relative text-center overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>

          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Now Hosting</span>
          {queueData.nowServing ? (
            <div className="space-y-1 mt-2">
              <h2 className="text-6xl font-extrabold text-slate-900 tracking-tight animate-pulse">
                Token #{queueData.nowServing}
              </h2>
              {queueData.activePatient?.name && (
                <p className="text-sm font-bold text-slate-700 capitalize mt-1">({queueData.activePatient.name})</p>
              )}
            </div>
          ) : (
            <h2 className="text-4xl font-extrabold text-slate-400 tracking-tight mt-2">
              --
            </h2>
          )}
          <p className="text-[10px] text-slate-500 mt-3 uppercase tracking-widest font-bold">Proceed to Room</p>
        </div>

        {/* Personalization / My Position */}
        <div className="p-5 rounded-2xl border glass-panel space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Are you in the queue? Track your position:</label>
            <select
              value={selectedMyToken}
              onChange={(e) => handleSelectToken(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/25 transition"
            >
              <option value="">-- Select Your Token Number --</option>
              {queueData.waitingList?.map((p) => (
                <option key={p.token} value={p.token}>
                  Token #{p.token} {p.isPriority ? '(Priority)' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedMyToken && tokensAhead !== -1 && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700">Your Ticket: <strong className="text-blue-600">#{selectedMyToken}</strong></span>
                <WaitTimeBadge waitTime={estimatedWait} />
              </div>
              <p className="text-xs text-slate-700 font-medium">
                Position: <strong className="text-blue-600">{tokensAhead}</strong> patient(s) ahead of you.
              </p>
            </div>
          )}
        </div>

        {/* WhatsApp Subscribing Alert */}
        {queueData.waitingList && (
          <NotifyMe doctorId={doctorId} waitingList={queueData.waitingList} />
        )}

        {/* Waiting List Visual */}
        <div className="p-6 rounded-2xl border glass-panel space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Queue Sequence</h3>
            <span className="text-[10px] text-slate-400 font-semibold">{queueData.waitingList?.length || 0} waiting</span>
          </div>
          
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {queueData.waitingList && queueData.waitingList.length > 0 ? (
              queueData.waitingList.map((item, index) => {
                const isSelected = Number(selectedMyToken) === item.token;
                
                // Calculate real-time estimated wait time subtracting elapsed time of active patient
                let estWait = index * (queueData.avgConsultTime || 5);
                if (queueData.activePatient?.calledAt) {
                  const calledTime = new Date(queueData.activePatient.calledAt).getTime();
                  const elapsedMinutes = (Date.now() - calledTime) / 60000;
                  const remainingActiveTime = Math.max(0, (queueData.avgConsultTime || 5) - elapsedMinutes);
                  estWait = Math.round(remainingActiveTime + index * (queueData.avgConsultTime || 5));
                }

                return (
                  <div 
                    key={item.token}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs transition duration-300 ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                        : item.isPriority 
                          ? 'bg-purple-50/80 border-purple-100 text-purple-950' 
                          : 'bg-slate-50/80 border-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : item.isPriority 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-200 text-slate-700'
                      }`}>
                        #{item.token}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold">{item.name}</span>
                        <span className={`text-[9px] font-semibold ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                          Est. wait: {estWait} mins
                        </span>
                      </div>
                    </div>
                    {item.isPriority && (
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-purple-100 text-purple-700'
                      }`}>
                        Priority
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-2">Queue is empty right now.</p>
            )}
          </div>
        </div>

      </main>

      {/* Footer / Branding */}
      <footer className="pt-4 border-t border-slate-100 text-center space-y-1">
        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-bold">
          Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> by CMC Hospital
        </p>
      </footer>
    </div>
  );
};

export default PatientQueue;

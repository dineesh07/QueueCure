import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Users } from 'lucide-react';

const PublicDisplay = () => {
  const navigate = useNavigate();
  const [doctorsQueues, setDoctorsQueues] = useState({});
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let retryTimeout;
    const fetchAllQueues = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/queue/doctors`);
        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }
        const docs = await response.json();
        setDoctorsList(docs);

        // Fetch initial state for each doctor
        const initialQueues = {};
        for (const doc of docs) {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/queue/${doc._id}`);
          if (res.ok) {
            const data = await res.json();
            initialQueues[doc._id] = data;
          }
        }
        setDoctorsQueues(initialQueues);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching all queues, retrying in 2 seconds:', err);
        retryTimeout = setTimeout(fetchAllQueues, 2000);
      }
    };

    fetchAllQueues();

    // Listen for live queue updates for any doctor
    const handleQueueUpdate = (data) => {
      if (data && data.doctorId) {
        setDoctorsQueues((prev) => ({
          ...prev,
          [data.doctorId]: data,
        }));
      }
    };

    socket.on('queue:updated', handleQueueUpdate);

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      socket.off('queue:updated');
    };
  }, []);

  // Handle socket rooms join & reconnect
  useEffect(() => {
    if (doctorsList.length === 0) return;

    const joinAllDoctorRooms = () => {
      doctorsList.forEach((doc) => {
        socket.emit('join:doctor', doc._id);
      });
    };

    if (socket.connected) {
      joinAllDoctorRooms();
    }

    socket.on('connect', joinAllDoctorRooms);

    return () => {
      socket.off('connect', joinAllDoctorRooms);
    };
  }, [doctorsList]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Loading Public Queue Board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 flex flex-col justify-between p-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Banner */}
      <header className="border border-slate-100 bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl flex items-center justify-between mb-8 shadow-sm">
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
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">CMC Hospital</h1>
            <span className="text-[9px] text-blue-600 font-bold uppercase tracking-widest block mt-0.5">Live Public Department Board</span>
          </div>
        </div>

        {/* Live Clock / Date */}
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800">
              {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-[10px] text-slate-500 font-bold tracking-wider mt-0.5">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
      </header>

      {/* Grid of Doctor Chambers */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {doctorsList.map((doc) => {
          const qData = doctorsQueues[doc._id] || {};
          const currentServing = qData.nowServing;
          const waitingList = qData.waitingList || [];

          return (
            <div key={doc._id} className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition duration-300 relative overflow-hidden">
              {/* Subtle Glow Accent */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>

              {/* Header Info */}
              <div className="border-b border-slate-100 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 leading-tight">{doc.name}</h2>
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{doc.room}</span>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-700 font-bold rounded-full flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                    Active
                  </div>
                </div>
              </div>

              {/* Currently Serving Display */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 text-center mb-6">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Now Hosting</span>
                {currentServing ? (
                  <div className="space-y-1 mt-1">
                    <h3 className="text-5xl font-black text-emerald-600 tracking-tight animate-pulse">
                      Token #{currentServing}
                    </h3>
                    {qData.activePatient?.name && (
                      <p className="text-sm font-bold text-slate-700 capitalize mt-1">{qData.activePatient.name}</p>
                    )}
                  </div>
                ) : (
                  <h3 className="text-3xl font-extrabold text-slate-400 mt-2">--</h3>
                )}
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block mt-2">Please Proceed to Room</span>
              </div>

              {/* Next Waiting List Display */}
              <div className="flex-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Next in Queue
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{waitingList.length} waiting</span>
                </h4>
                {waitingList.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {waitingList.slice(0, 5).map((patient) => (
                      <div
                        key={patient.token}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition duration-300 ${
                          patient.isPriority
                            ? 'bg-purple-50/80 border-purple-100 text-purple-950'
                            : 'bg-slate-50/80 border-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-[11px] ${
                            patient.isPriority ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            #{patient.token}
                          </span>
                          <span className="font-bold">{patient.name}</span>
                        </div>
                        {patient.isPriority && (
                          <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-purple-100 text-purple-700 uppercase tracking-wider">
                            Priority
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No patients waiting</p>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* Footer Branding (Empty space/divider preserved for layout height consistency, branding texts removed) */}
      <footer className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-center text-slate-400 text-[10px] gap-2">
      </footer>
    </div>
  );
};

export default PublicDisplay;

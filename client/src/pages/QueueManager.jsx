import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import QRDisplay from '../components/QRDisplay';
import { 
  UserPlus, Play, AlertCircle, CheckCircle, 
  RotateCcw, Sparkles, Phone, User, Clock 
} from 'lucide-react';

const QueueManager = ({ token, receptionistId }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [queueState, setQueueState] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [timerMax, setTimerMax] = useState(90);
  const timerIntervalRef = useRef(null);

  // Undo notification state
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState(null);

  // Fetch doctors list on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/queue/doctors`);
        const data = await response.json();
        setDoctors(data);
        if (data.length > 0) {
          setSelectedDoctorId(data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  // Listen to socket room for selected doctor
  useEffect(() => {
    if (!selectedDoctorId) return;

    // Reset local queue
    setQueueState(null);
    setTimerSeconds(null);

    const joinRooms = () => {
      socket.emit('join:doctor', selectedDoctorId);
      socket.emit('join:receptionist', selectedDoctorId);
    };

    // Join now
    if (socket.connected) {
      joinRooms();
    }

    // Also join on reconnect/connect
    socket.on('connect', joinRooms);

    // Initial REST fetch
    const fetchQueueState = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/queue/${selectedDoctorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setQueueState(data);
        }
      } catch (err) {
        console.error('Error fetching queue REST state:', err);
      }
    };
    fetchQueueState();

    // Listeners
    socket.on('queue:receptionist-updated', (data) => {
      if (data.doctorId === selectedDoctorId) {
        setQueueState(data);
      }
    });

    socket.on('timer:started', ({ duration, startedAt }) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      
      const updateTimer = () => {
        const elapsed = (Date.now() - startedAt) / 1000;
        const remaining = Math.max(0, duration - elapsed);
        setTimerSeconds(Math.round(remaining));
        setTimerMax(duration);

        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current);
          setTimerSeconds(null);
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
    });

    // Reset timer if done or skip clears it
    socket.on('queue:receptionist-updated', (data) => {
      if (data.doctorId === selectedDoctorId) {
        setQueueState(data);
        if (!data.activePatient) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          setTimerSeconds(null);
        }
      }
    });

    return () => {
      socket.off('connect', joinRooms);
      socket.off('queue:receptionist-updated');
      socket.off('timer:started');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [selectedDoctorId, token]);

  const handleAddPatient = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    socket.emit('queue:add-patient', {
      doctorId: selectedDoctorId,
      name,
      phone,
      isPriority,
      receptionistId
    });

    // Reset Form
    setName('');
    setPhone('');
    setIsPriority(false);
    setLoading(false);
    
    // Trigger undo toast visual cue
    triggerUndoToast('add');
  };

  const handleCallNext = () => {
    socket.emit('queue:call-next', { doctorId: selectedDoctorId });
    triggerUndoToast('call-next');
  };

  const handleSkip = (patientId) => {
    socket.emit('queue:skip', { doctorId: selectedDoctorId, patientId });
    triggerUndoToast('skip');
  };

  const handleDone = (patientId) => {
    socket.emit('queue:done', { doctorId: selectedDoctorId, patientId });
    triggerUndoToast('done');
  };

  const handleUndo = () => {
    socket.emit('queue:undo', { doctorId: selectedDoctorId });
    setShowUndoToast(false);
  };

  const handleSetAvgTime = (newVal) => {
    socket.emit('queue:set-avg-time', { doctorId: selectedDoctorId, avgConsultTime: Number(newVal) });
  };

  const triggerUndoToast = (actionType) => {
    setShowUndoToast(true);
    if (undoTimeout) clearTimeout(undoTimeout);
    const timeout = setTimeout(() => {
      setShowUndoToast(false);
    }, 5000);
    setUndoTimeout(timeout);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Bar / Config */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-6 rounded-2xl border glass-panel">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" /> Queue Control Room
          </h2>
          <p className="text-xs text-slate-500">Select doctor to assign tickets and process consultations.</p>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Active Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition"
            >
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>{d.name} ({d.room})</option>
              ))}
            </select>
          </div>

          {queueState && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Avg Consultation (min)</label>
              <input
                type="number"
                min={1}
                value={queueState.avgConsultTime}
                onChange={(e) => handleSetAvgTime(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 w-24 text-center focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form & QR Code */}
        <div className="space-y-6 lg:col-span-1">
          {/* Add Patient Form */}
          <div className="p-6 rounded-2xl border glass-panel space-y-4">
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" /> Add Patient
            </h3>
            
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter patient name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="block text-xs font-semibold text-slate-800">Priority Token</span>
                  <span className="block text-[10px] text-slate-500">Emergency / Senior Citizens</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isPriority} 
                    onChange={(e) => setIsPriority(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Issue Ticket</span>
              </button>
            </form>
          </div>

          {/* QR Display component */}
          {queueState && (
            <QRDisplay 
              doctorId={selectedDoctorId} 
              doctorName={queueState.doctorName} 
              room={queueState.room} 
            />
          )}
        </div>

        {/* Right Column: Queue Manager Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Serving Panel */}
          <div className="p-6 rounded-2xl border glass-panel relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">Currently Serving</span>
                {queueState?.activePatient ? (
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                    Token #{queueState.activePatient.token} 
                    <span className="text-lg font-normal text-slate-500 ml-3">({queueState.activePatient.name})</span>
                  </h3>
                ) : (
                  <h3 className="text-2xl font-bold text-slate-400 mt-1">No Active Consultations</h3>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCallNext}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  <Play className="w-4 h-4 fill-current" /> Call Next Patient
                </button>
                
                {queueState?.activePatient && (
                  <>
                    <button
                      onClick={() => handleSkip(queueState.activePatient.id)}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl border border-rose-200 text-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4" /> Skip
                    </button>
                    <button
                      onClick={() => handleDone(queueState.activePatient.id)}
                      className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-semibold rounded-xl border border-emerald-200 text-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" /> Done
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Auto-Skip 90s Timer Progress Bar */}
            {timerSeconds !== null && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-amber-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 animate-pulse" /> No-Show Countdown
                  </span>
                  <span className="text-slate-600">{timerSeconds} seconds remaining</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(timerSeconds / timerMax) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Queue List Table */}
          <div className="p-6 rounded-2xl border glass-panel space-y-4">
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
              Waiting Queue List ({queueState?.waitingList?.length || 0} Patients)
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-100">
                    <th className="p-4">Token</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Wait Time</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {queueState?.waitingList?.length > 0 ? (
                    queueState.waitingList.map((patient, index) => {
                      const estWait = index * queueState.avgConsultTime;
                      return (
                        <tr key={patient.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-bold text-purple-600">#{patient.token}</td>
                          <td className="p-4 font-semibold text-slate-800">{patient.name}</td>
                          <td className="p-4">
                            {patient.isPriority ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-50 text-purple-600 border border-purple-100">
                                Priority
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-4 text-slate-600 font-semibold">{estWait} mins</td>
                          <td className="p-4 capitalize">
                            <span className="px-2 py-0.5 text-xs rounded bg-amber-50 text-amber-600 border border-amber-100">
                              {patient.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                        No patients waiting in queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Undo Toast Notification */}
      {showUndoToast && (
        <div className="fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl bg-white border border-slate-200 text-slate-800 flex items-center justify-between gap-4 z-50 animate-bounce">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
              5s
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Action performed</p>
              <p className="text-[10px] text-slate-500">Click undo within 5 seconds to revert</p>
            </div>
          </div>
          <button
            onClick={handleUndo}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Undo
          </button>
        </div>
      )}
    </div>
  );
};

export default QueueManager;

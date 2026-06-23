import React from 'react';
import { Users, Clock, UserX } from 'lucide-react';

const ShiftStats = ({ completedCount, avgConsultTime, skippedCount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
      {/* Completed Card */}
      <div className="group p-6 rounded-2xl border glass-panel flex items-center gap-5 transition-all duration-300 hover:border-purple-200 hover:bg-purple-50/5 hover:shadow-md">
        <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-600 transition-transform duration-300 group-hover:scale-110">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patients Handled</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{completedCount ?? 0}</h3>
        </div>
      </div>

      {/* Avg Consult Time Card */}
      <div className="group p-6 rounded-2xl border glass-panel flex items-center gap-5 transition-all duration-300 hover:border-emerald-200 hover:bg-emerald-50/5 hover:shadow-md">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-600 transition-transform duration-300 group-hover:scale-110">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Consult Time (Live)</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            {avgConsultTime ? `${avgConsultTime}m` : '--'}
          </h3>
        </div>
      </div>

      {/* Skipped Count Card */}
      <div className="group p-6 rounded-2xl border glass-panel flex items-center gap-5 transition-all duration-300 hover:border-rose-200 hover:bg-rose-50/5 hover:shadow-md">
        <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-600 transition-transform duration-300 group-hover:scale-110">
          <UserX className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skipped / No Show</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{skippedCount ?? 0}</h3>
        </div>
      </div>
    </div>
  );
};

export default ShiftStats;

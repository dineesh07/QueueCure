import React from 'react';

const TokenCard = ({ token, name, isPriority, status, calledAt, completedAt, duration }) => {
  const statusColors = {
    waiting: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    in_progress: 'bg-purple-500/15 text-purple-400 border-purple-500/30 pulse-active',
    done: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    skipped: 'bg-rose-500/10 text-rose-400 border-rose-500/25'
  };

  return (
    <div className={`p-4 rounded-xl border glass-card transition-all duration-300 hover:scale-[1.02] flex items-center justify-between ${isPriority ? 'border-purple-500/40 bg-purple-950/10' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${isPriority ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-300'}`}>
          #{token}
        </div>
        <div>
          <h4 className="font-semibold text-slate-200">{name || 'Patient'}</h4>
          <div className="flex gap-2 mt-1">
            {isPriority && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Priority
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs font-semibold rounded border capitalize ${statusColors[status] || 'bg-slate-700'}`}>
              {status === 'in_progress' ? 'Serving' : status}
            </span>
          </div>
        </div>
      </div>
      
      <div className="text-right text-xs text-slate-400">
        {calledAt && <div>Called: {new Date(calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
        {completedAt && <div>Completed: {new Date(completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
        {duration && <div className="text-emerald-400 font-medium">Session: {duration}m</div>}
      </div>
    </div>
  );
};

export default TokenCard;

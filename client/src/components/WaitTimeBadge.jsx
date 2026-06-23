import React from 'react';
import { Clock } from 'lucide-react';

const WaitTimeBadge = ({ waitTime }) => {
  const roundedTime = Math.round(waitTime);
  
  let colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (roundedTime > 30) {
    colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (roundedTime > 15) {
    colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${colorClass}`}>
      <Clock className="w-3.5 h-3.5" />
      <span>Est. Wait: {roundedTime}m</span>
    </div>
  );
};

export default WaitTimeBadge;

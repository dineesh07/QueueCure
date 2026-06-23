import React, { useState } from 'react';

const NotifyMe = ({ doctorId, waitingList }) => {
  const [selectedToken, setSelectedToken] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedToken) {
      setError('Please select your token number.');
      return;
    }
    if (!phone) {
      setError('Please enter your WhatsApp number.');
      return;
    }
    // simple number format check
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notify/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doctorId,
          token: Number(selectedToken),
          phone
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to register notification.');
      }

      setMessage(`Subscribed! Token #${selectedToken} will be notified via WhatsApp when you are close.`);
      setPhone('');
      setSelectedToken('');
    } catch (err) {
      setError(err.message || 'Failed to submit number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl border glass-panel">
      <h3 className="text-md font-bold text-slate-100 mb-2 flex items-center gap-2">
        {/* Simple WhatsApp Icon */}
        <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.012 2C6.48 2 2.006 6.474 2.006 12c0 1.77.462 3.498 1.342 5.03l-1.354 4.947 5.06-1.328A9.94 9.94 0 0 0 12.012 22c5.525 0 10-4.47 10-10s-4.475-10-10-10zM17.7 15.65c-.242.678-1.22 1.242-1.68 1.282-.46.04-1.047.072-2.955-.69a10.875 10.875 0 0 1-4.832-4.254c-.653-.872-1.047-1.89-1.047-2.95 0-1.638.855-2.45 1.168-2.775.313-.325.688-.407.915-.407h.653c.21 0 .42.012.613.435.21.46.726 1.77.79 1.898.064.127.108.28.02.46-.088.178-.133.292-.266.445-.133.153-.278.344-.396.462-.132.126-.27.265-.115.534.153.268.68.113 1.46.808.6.535 1.107.886 1.488 1.077.382.19.61.16.837-.102.228-.26.974-1.134 1.235-1.52.26-.388.52-.325.875-.19.356.133 2.257 1.063 2.646 1.254.39.19.65.286.745.446.096.16.096.93-.146 1.607z" />
        </svg>
        Notify Me Near Turn
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Enter your WhatsApp number to receive an alert when there are only 2 or fewer patients ahead of you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Select Token</label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/25 transition"
          >
            <option value="">-- Choose Your Token --</option>
            {waitingList.map((p) => (
              <option key={p.token} value={p.token}>
                Token #{p.token} {p.isPriority ? '(Priority)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">WhatsApp Number (10 Digits)</label>
          <div className="flex gap-2">
            <span className="bg-slate-800 border border-slate-700/60 rounded-lg py-2.5 px-3 text-sm text-slate-400 flex items-center font-medium">+91</span>
            <input
              type="tel"
              maxLength={10}
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/25 transition"
            />
          </div>
        </div>

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        {message && <p className="text-xs text-emerald-400 font-medium">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/40 disabled:text-slate-400 text-white font-medium rounded-lg text-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span>Activating...</span>
          ) : (
            <span>Enable WhatsApp Alerts</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default NotifyMe;

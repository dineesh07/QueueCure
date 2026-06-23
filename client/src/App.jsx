import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientQueue from './pages/PatientQueue';
import PublicDisplay from './pages/PublicDisplay';

function App() {
  return (
    <Router>
      <div className="min-h-screen text-slate-900">
        <Routes>
          <Route path="/" element={<PublicDisplay />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/queue/:doctorId" element={<PatientQueue />} />
          {/* Default Redirects */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

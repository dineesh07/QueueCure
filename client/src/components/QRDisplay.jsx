import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRDisplay = ({ doctorId, doctorName, room }) => {
  const queueUrl = `${window.location.origin}/queue/${doctorId}`;

  return (
    <div className="flex flex-col items-center p-6 rounded-2xl border glass-panel text-center">
      <h3 className="text-lg font-bold text-slate-800 mb-1">{doctorName}</h3>
      <p className="text-xs text-purple-600 mb-4">{room}</p>
      
      <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200">
        <QRCodeSVG value={queueUrl} size={150} level="H" />
      </div>
      
      <p className="text-xs text-slate-500 mt-4 max-w-[220px]">
        Scan this QR code to view your live queue position and estimated wait times on your device.
      </p>
      
      <a 
        href={queueUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="mt-3 text-xs text-purple-600 hover:text-purple-500 underline font-semibold transition"
      >
        Open Patient Screen Link
      </a>
    </div>
  );
};

export default QRDisplay;

import { io } from 'socket.io-client';

// Fallback to localhost if not specified in VITE_API_URL env variable
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true
});

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Models
import Doctor from './models/Doctor.js';
import Receptionist from './models/Receptionist.js';

// Routes
import authRoutes from './routes/auth.js';
import queueRoutes from './routes/queue.js';
import shiftRoutes from './routes/shift.js';
import notifyRoutes from './routes/notify.js';

// Socket Register
import registerQueueHandlers from './socket/queueSocket.js';

dotenv.config();
dotenv.config({ path: '../.env' });

const app = express();
const server = http.createServer(app);

// Enable CORS
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/shift', shiftRoutes);
app.use('/api/notify', notifyRoutes);

// Socket.io integration
const io = new Server(server, {
  cors: corsOptions
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  registerQueueHandlers(io, socket);
});

// Database Seed Logic
const seedDatabase = async () => {
  try {
    const receptionistsToSeed = [
      { name: 'Priya', email: 'priya@cmc.com' },
      { name: 'Kavitha', email: 'kavitha@cmc.com' },
      { name: 'Anitha', email: 'anitha@cmc.com' },
      { name: 'Meena', email: 'meena@cmc.com' },
      { name: 'Divya', email: 'divya@cmc.com' },
      { name: 'Sowmya', email: 'sowmya@cmc.com' },
      { name: 'Revathi', email: 'revathi@cmc.com' },
      { name: 'Lakshmi', email: 'lakshmi@cmc.com' },
      { name: 'Deepa', email: 'deepa@cmc.com' },
      { name: 'Santhiya', email: 'santhiya@cmc.com' }
    ];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('pass123', salt);

    for (const rep of receptionistsToSeed) {
      const exists = await Receptionist.findOne({ email: rep.email });
      if (!exists) {
        const newReceptionist = new Receptionist({
          name: rep.name,
          email: rep.email,
          passwordHash: hashedPassword,
          role: 'receptionist'
        });
        await newReceptionist.save();
        console.log(`Seeded receptionist: ${rep.email} / pass123`);
      }
    }


    const doctorCount = await Doctor.countDocuments();
    if (doctorCount === 0) {
      await Doctor.insertMany([
        { name: 'Dr. Jane Smith', room: 'Room 101', avgConsultTime: 8, isActive: true },
        { name: 'Dr. John Doe', room: 'Room 102', avgConsultTime: 10, isActive: true },
        { name: 'Dr. Sarah Jenkins', room: 'Room 103', avgConsultTime: 12, isActive: true }
      ]);
      console.log('Seeded default doctors list');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/queue-cure';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    await seedDatabase();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });

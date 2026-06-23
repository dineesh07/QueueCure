import express from 'express';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { protect } from '../middleware/authMiddleware.js';
import { getQueueState } from '../utils/queueHelper.js';

const router = express.Router();

// Get list of active doctors
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true });
    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching doctors' });
  }
});

// Get current queue state for a doctor
router.get('/:doctorId', async (req, res) => {
  try {
    const state = await getQueueState(req.params.doctorId);
    if (!state) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Check if request is authenticated as receptionist
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      return res.json(state.receptionist);
    }
    
    res.json(state.public);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching queue state' });
  }
});

// Set avg consultation time per doctor
router.post('/set-avg-time', protect, async (req, res) => {
  const { doctorId, avgConsultTime } = req.body;
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    doctor.avgConsultTime = Number(avgConsultTime);
    await doctor.save();

    res.json({ message: 'Average consultation time updated successfully', doctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating consultation time' });
  }
});

export default router;

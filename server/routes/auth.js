import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Receptionist from '../models/Receptionist.js';
import Shift from '../models/Shift.js';
import Patient from '../models/Patient.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const receptionist = await Receptionist.findOne({ email });
    if (!receptionist) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, receptionist.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create a new shift log
    const shift = new Shift({
      receptionistId: receptionist._id,
      shiftStart: new Date(),
      patientsHandled: 0,
      skippedCount: 0,
      priorityCount: 0,
      avgHandleTime: 0
    });
    await shift.save();

    const token = jwt.sign(
      { id: receptionist._id, shiftId: shift._id },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '12h' }
    );

    res.json({
      token,
      receptionist: {
        id: receptionist._id,
        name: receptionist.name,
        email: receptionist.email,
        role: receptionist.role
      },
      shiftId: shift._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', protect, async (req, res) => {
  const { shiftId } = req.body;
  try {
    const shift = await Shift.findById(shiftId);
    if (shift && !shift.shiftEnd) {
      shift.shiftEnd = new Date();

      // Retrieve all patients processed by this receptionist during their shift
      const completedPatients = await Patient.find({
        addedBy: req.receptionist._id,
        calledAt: { $gte: shift.shiftStart },
        completedAt: { $exists: true },
        status: 'done'
      });

      const skips = await Patient.countDocuments({
        addedBy: req.receptionist._id,
        calledAt: { $gte: shift.shiftStart },
        status: 'skipped'
      });

      const priorities = await Patient.countDocuments({
        addedBy: req.receptionist._id,
        addedAt: { $gte: shift.shiftStart },
        isPriority: true
      });

      shift.patientsHandled = completedPatients.length;
      shift.skippedCount = skips;
      shift.priorityCount = priorities;

      if (completedPatients.length > 0) {
        const totalDuration = completedPatients.reduce((acc, p) => {
          if (p.completedAt && p.calledAt) {
            return acc + (p.completedAt - p.calledAt);
          }
          return acc;
        }, 0);
        shift.avgHandleTime = (totalDuration / completedPatients.length) / 60000; // in minutes
      }

      await shift.save();

      return res.json({
        message: 'Logged out successfully, shift completed',
        shiftSummary: {
          shiftStart: shift.shiftStart,
          shiftEnd: shift.shiftEnd,
          patientsHandled: shift.patientsHandled,
          skippedCount: shift.skippedCount,
          priorityCount: shift.priorityCount,
          avgHandleTime: shift.avgHandleTime.toFixed(1)
        }
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error on logout' });
  }
});

// Me
router.get('/me', protect, async (req, res) => {
  res.json({
    id: req.receptionist._id,
    name: req.receptionist.name,
    email: req.receptionist.email,
    role: req.receptionist.role
  });
});

export default router;

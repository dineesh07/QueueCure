import express from 'express';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Shift from '../models/Shift.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  try {
    // Retrieve receptionist's active shift
    const latestShift = await Shift.findOne({
      receptionistId: req.receptionist._id,
      shiftEnd: { $exists: false }
    }).sort({ shiftStart: -1 });

    const shiftStart = latestShift ? latestShift.shiftStart : startOfDay;

    // Total patients completed in this shift
    const completedCount = await Patient.countDocuments({
      status: 'done',
      completedAt: { $gte: shiftStart }
    });

    // Average consultation time live (from completed patients today across all receptionists/doctors for dynamic clinic metric)
    const completedToday = await Patient.find({
      status: 'done',
      completedAt: { $gte: startOfDay },
      calledAt: { $exists: true }
    });

    let avgConsultTime = 0;
    if (completedToday.length > 0) {
      const totalTime = completedToday.reduce((acc, curr) => {
        if (curr.completedAt && curr.calledAt) {
          return acc + (curr.completedAt - curr.calledAt);
        }
        return acc;
      }, 0);
      avgConsultTime = (totalTime / completedToday.length) / 60000; // in minutes
    }

    // Skipped count in current shift
    const skippedCount = await Patient.countDocuments({
      status: 'skipped',
      calledAt: { $gte: shiftStart }
    });

    // Busiest hour of the day (aggregated per hour based on addedAt for today)
    const patientsAddedToday = await Patient.find({
      addedAt: { $gte: startOfDay }
    });

    const hourlyCounts = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i === 0 ? 12 : i > 12 ? i - 12 : i} ${i >= 12 ? 'PM' : 'AM'}`,
      count: 0
    }));

    patientsAddedToday.forEach(p => {
      const hour = new Date(p.addedAt).getHours();
      hourlyCounts[hour].count += 1;
    });

    // Limit to standard clinic operational hours: 8 AM to 8 PM
    const busiestHours = hourlyCounts.slice(8, 21);

    // Live queue depth per doctor
    const doctors = await Doctor.find({ isActive: true });
    const queueDepths = await Promise.all(doctors.map(async (doc) => {
      const waitingCount = await Patient.countDocuments({
        doctorId: doc._id,
        status: 'waiting'
      });
      return {
        doctorId: doc._id,
        doctorName: doc.name,
        waitingCount
      };
    }));

    res.json({
      completedCount,
      avgConsultTime: Number(avgConsultTime.toFixed(1)),
      skippedCount,
      busiestHours,
      queueDepths
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

export default router;

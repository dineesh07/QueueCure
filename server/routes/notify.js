import express from 'express';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { sendWhatsApp } from '../utils/whatsapp.js';

const router = express.Router();

router.post('/subscribe', async (req, res) => {
  const { doctorId, token, phone } = req.body;

  if (!doctorId || !token || !phone) {
    return res.status(400).json({ message: 'Missing doctorId, token, or phone number' });
  }

  try {
    const patient = await Patient.findOne({ doctorId, token, status: 'waiting' });
    if (!patient) {
      return res.status(404).json({ message: 'Waiting patient token not found' });
    }

    patient.phone = phone;
    await patient.save();

    // Trigger notification immediately if patient is already in the notification range (tokensAhead <= 2)
    const doctor = await Doctor.findById(doctorId);
    const waitingList = await Patient.find({ doctorId, status: 'waiting' })
      .sort({ isPriority: -1, addedAt: 1 });

    const index = waitingList.findIndex(p => p._id.toString() === patient._id.toString());
    if (index !== -1 && index <= 2 && !patient.notified) {
      const message = `You're almost up! Token #${patient.token} — ${index} patient(s) ahead. Head to Dr. ${doctor.name}'s room (${doctor.room}).`;
      await sendWhatsApp(phone, message);
      patient.notified = true;
      await patient.save();
    }

    res.json({ message: 'Subscribed to WhatsApp notifications successfully' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Server error saving subscription' });
  }
});

export default router;

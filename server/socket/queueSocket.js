import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { getQueueState } from '../utils/queueHelper.js';
import { sendWhatsApp } from '../utils/whatsapp.js';

// Timers disabled to allow manual flow only

// In-memory store for Undo feature (5 second window)
const lastActions = {}; // doctorId -> { action, patientId, extraData, timestamp }

// Helper to broadcast updated queue state to everyone
export const broadcastQueueState = async (io, doctorId) => {
  const state = await getQueueState(doctorId);
  if (!state) return;

  // Broadcast sanitized state to patients
  io.to(`doctor_${doctorId}`).emit('queue:updated', state.public);
  
  // Broadcast detailed state to receptionists
  io.to(`receptionist_${doctorId}`).emit('queue:receptionist-updated', state.receptionist);
  
  // Also emit a general update to dashboard stats clients if any
  io.emit('queue:stats-updated');
};

// Helper to trigger WhatsApp alerts for patients near their turn
const triggerWhatsAppAlerts = async (doctorId, doctorName, room) => {
  try {
    const waitingList = await Patient.find({ doctorId, status: 'waiting' })
      .sort({ isPriority: -1, addedAt: 1 });

    for (let i = 0; i < waitingList.length; i++) {
      const patient = waitingList[i];
      const tokensAhead = i; // index in sorted waiting list represents how many tokens are ahead

      if (tokensAhead <= 2 && patient.phone && !patient.notified) {
        const message = `You're almost up! Token #${patient.token} — ${tokensAhead} patient(s) ahead. Head to Dr. ${doctorName}'s room (${room}).`;
        await sendWhatsApp(patient.phone, message);
        
        patient.notified = true;
        await patient.save();
      }
    }
  } catch (error) {
    console.error('Error triggering WhatsApp notifications:', error);
  }
};

export default function registerQueueHandlers(io, socket) {
  // Join doctor channel (used by patients and receptionists)
  socket.on('join:doctor', async (doctorId) => {
    socket.join(`doctor_${doctorId}`);
    // Send current state on join
    const state = await getQueueState(doctorId);
    if (state) {
      socket.emit('queue:updated', state.public);
    }
  });

  // Join receptionist channel for secure updates
  socket.on('join:receptionist', async (doctorId) => {
    socket.join(`receptionist_${doctorId}`);
    // Send full receptionist state on join
    const state = await getQueueState(doctorId);
    if (state) {
      socket.emit('queue:receptionist-updated', state.receptionist);
    }
  });

  // Add Patient
  socket.on('queue:add-patient', async ({ doctorId, name, phone, isPriority, receptionistId }) => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Find the highest token number for this doctor today
      const lastPatient = await Patient.findOne({
        doctorId,
        addedAt: { $gte: startOfDay }
      }).sort({ token: -1 });

      const nextToken = lastPatient ? lastPatient.token + 1 : 1;

      const newPatient = new Patient({
        token: nextToken,
        name,
        phone: phone || '',
        doctorId,
        status: 'waiting',
        isPriority: !!isPriority,
        addedBy: receptionistId
      });

      await newPatient.save();

      // Store history for undo
      lastActions[doctorId] = {
        action: 'add',
        patientId: newPatient._id,
        timestamp: Date.now()
      };

      await broadcastQueueState(io, doctorId);
      
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        await triggerWhatsAppAlerts(doctorId, doctor.name, doctor.room);
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      socket.emit('queue:error', 'Failed to add patient');
    }
  });

  // Call Next
  socket.on('queue:call-next', async ({ doctorId }) => {
    try {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) return;

      // Find if there is an in_progress patient, complete them first
      const currentActive = await Patient.findOne({ doctorId, status: 'in_progress' });
      let completedPatientId = null;

      if (currentActive) {
        currentActive.status = 'done';
        currentActive.completedAt = new Date();
        await currentActive.save();
        completedPatientId = currentActive._id;
      }

      // Find next waiting patient (sorted by priority first, then oldest addedAt)
      const nextPatient = await Patient.findOne({ doctorId, status: 'waiting' })
        .sort({ isPriority: -1, addedAt: 1 });

      if (!nextPatient) {
        socket.emit('queue:error', 'No patients waiting in queue');
        
        // If we completed the current active patient but there is no next, we still save that action
        if (currentActive) {
          lastActions[doctorId] = {
            action: 'complete-only',
            patientId: currentActive._id,
            timestamp: Date.now()
          };
          await broadcastQueueState(io, doctorId);
        }
        return;
      }

      nextPatient.status = 'in_progress';
      nextPatient.calledAt = new Date();
      await nextPatient.save();



      // Store history for undo
      lastActions[doctorId] = {
        action: 'call-next',
        patientId: nextPatient._id,
        previousCompletedId: completedPatientId,
        timestamp: Date.now()
      };

      await broadcastQueueState(io, doctorId);
      await triggerWhatsAppAlerts(doctorId, doctor.name, doctor.room);
    } catch (error) {
      console.error('Error calling next patient:', error);
      socket.emit('queue:error', 'Failed to call next patient');
    }
  });

  // Skip Patient
  socket.on('queue:skip', async ({ doctorId, patientId }) => {
    try {
      const patient = await Patient.findById(patientId);
      if (!patient || patient.status !== 'in_progress') return;

      patient.status = 'skipped';
      await patient.save();



      // Store history for undo
      lastActions[doctorId] = {
        action: 'skip',
        patientId: patient._id,
        timestamp: Date.now()
      };

      await broadcastQueueState(io, doctorId);
    } catch (error) {
      console.error('Error skipping patient:', error);
      socket.emit('queue:error', 'Failed to skip patient');
    }
  });

  // Mark Done
  socket.on('queue:done', async ({ doctorId, patientId }) => {
    try {
      const patient = await Patient.findById(patientId);
      if (!patient || patient.status !== 'in_progress') return;

      patient.status = 'done';
      patient.completedAt = new Date();
      await patient.save();



      // Store history for undo
      lastActions[doctorId] = {
        action: 'done',
        patientId: patient._id,
        timestamp: Date.now()
      };

      await broadcastQueueState(io, doctorId);
    } catch (error) {
      console.error('Error completing session:', error);
      socket.emit('queue:error', 'Failed to complete session');
    }
  });

  // Undo Last Action (5 second window)
  socket.on('queue:undo', async ({ doctorId }) => {
    try {
      const lastAction = lastActions[doctorId];
      if (!lastAction) {
        socket.emit('queue:error', 'No recent action to undo');
        return;
      }

      const elapsed = Date.now() - lastAction.timestamp;
      if (elapsed > 5000) {
        socket.emit('queue:error', 'Undo window has expired (5 seconds max)');
        return;
      }

      const { action, patientId, previousCompletedId } = lastAction;

      if (action === 'add') {
        // Delete the added patient
        await Patient.findByIdAndDelete(patientId);
      } else if (action === 'call-next') {
        // Revert the called patient back to waiting
        const patient = await Patient.findById(patientId);
        if (patient) {
          patient.status = 'waiting';
          patient.calledAt = undefined;
          await patient.save();
        }

        // Revert the completed patient back to in_progress
        if (previousCompletedId) {
          const prevPatient = await Patient.findById(previousCompletedId);
          if (prevPatient) {
            prevPatient.status = 'in_progress';
            prevPatient.completedAt = undefined;
            await prevPatient.save();
          }
        }
      } else if (action === 'skip') {
        // Revert skipped patient back to in_progress
        const patient = await Patient.findById(patientId);
        if (patient) {
          patient.status = 'in_progress';
          await patient.save();
        }
      } else if (action === 'done') {
        // Revert done patient back to in_progress
        const patient = await Patient.findById(patientId);
        if (patient) {
          patient.status = 'in_progress';
          patient.completedAt = undefined;
          await patient.save();
        }
      } else if (action === 'complete-only') {
        // Revert done patient back to in_progress
        const patient = await Patient.findById(patientId);
        if (patient) {
          patient.status = 'in_progress';
          patient.completedAt = undefined;
          await patient.save();
        }
      }

      // Clear the action so we can't double-undo
      delete lastActions[doctorId];

      await broadcastQueueState(io, doctorId);
    } catch (error) {
      console.error('Error performing undo:', error);
      socket.emit('queue:error', 'Failed to undo action');
    }
  });

  // Set Avg Time
  socket.on('queue:set-avg-time', async ({ doctorId, avgConsultTime }) => {
    try {
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        doctor.avgConsultTime = Number(avgConsultTime);
        await doctor.save();
        io.emit('queue:config-updated', { doctorId, avgConsultTime });
        await broadcastQueueState(io, doctorId);
      }
    } catch (error) {
      console.error('Error setting avg time via socket:', error);
    }
  });

  socket.on('disconnect', () => {
    // Standard cleanup if needed, rooms are left automatically
  });
}

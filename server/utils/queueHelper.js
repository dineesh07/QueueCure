import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

export const getQueueState = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return null;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Calculate live average consultation time (must be real data if 3 or more completed)
  const completedToday = await Patient.find({
    doctorId,
    status: 'done',
    completedAt: { $gte: startOfDay },
    calledAt: { $exists: true }
  });

  const realAvg = completedToday.length >= 3
    ? (completedToday.reduce((acc, p) => acc + (p.completedAt - p.calledAt), 0) / completedToday.length) / 60000
    : doctor.avgConsultTime;

  // Find active patient in progress
  const activePatient = await Patient.findOne({ doctorId, status: 'in_progress' });
  const nowServing = activePatient ? activePatient.token : null;
  const activePatientDetails = activePatient ? {
    id: activePatient._id,
    token: activePatient.token,
    name: activePatient.name,
    calledAt: activePatient.calledAt
  } : null;

  // Waiting list sorted by priority DESC (true first) and then addedAt ASC
  const waitingPatients = await Patient.find({ doctorId, status: 'waiting' })
    .sort({ isPriority: -1, addedAt: 1 });

  // Sanitized list for public/patient dashboard
  const waitingListSanitized = waitingPatients.map(p => ({
    token: p.token,
    isPriority: p.isPriority
  }));

  // Full list for receptionist control room
  const waitingListFull = waitingPatients.map(p => ({
    id: p._id,
    token: p.token,
    name: p.name,
    phone: p.phone,
    isPriority: p.isPriority,
    addedAt: p.addedAt,
    status: p.status
  }));

  // Skipped and done lists for receptionist undo features
  const skippedPatients = await Patient.find({ doctorId, status: 'skipped', addedAt: { $gte: startOfDay } })
    .sort({ updatedAt: -1 });

  return {
    doctorId: doctor._id.toString(),
    doctorName: doctor.name,
    room: doctor.room,
    nowServing,
    activePatient: activePatientDetails,
    avgConsultTime: Number(realAvg.toFixed(1)),
    totalWaiting: waitingPatients.length,
    public: {
      doctorId: doctor._id.toString(),
      doctorName: doctor.name,
      room: doctor.room,
      nowServing,
      waitingList: waitingListSanitized,
      avgConsultTime: Number(realAvg.toFixed(1)),
      totalWaiting: waitingPatients.length
    },
    receptionist: {
      doctorId: doctor._id.toString(),
      doctorName: doctor.name,
      room: doctor.room,
      nowServing,
      activePatient: activePatientDetails,
      waitingList: waitingListFull,
      skippedList: skippedPatients.map(p => ({
        id: p._id,
        token: p.token,
        name: p.name,
        phone: p.phone,
        status: p.status,
        updatedAt: p.updatedAt
      })),
      avgConsultTime: Number(realAvg.toFixed(1)),
      totalWaiting: waitingPatients.length
    }
  };
};

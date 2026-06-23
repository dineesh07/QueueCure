import mongoose from 'mongoose';

const ShiftSchema = new mongoose.Schema({
  receptionistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receptionist', required: true },
  shiftStart: { type: Date, default: Date.now },
  shiftEnd: { type: Date },
  patientsHandled: { type: Number, default: 0 },
  skippedCount: { type: Number, default: 0 },
  priorityCount: { type: Number, default: 0 },
  avgHandleTime: { type: Number, default: 0 } // computed on shift end, in minutes
}, { timestamps: true });

export default mongoose.model('Shift', ShiftSchema);

import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  token: { type: Number, required: true }, // auto-incremented per doctor queue
  name: { type: String, required: true },
  phone: { type: String }, // optional, for WhatsApp notify
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  status: { type: String, enum: ['waiting', 'in_progress', 'done', 'skipped'], default: 'waiting' },
  isPriority: { type: Boolean, default: false },
  notified: { type: Boolean, default: false },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Receptionist' },
  addedAt: { type: Date, default: Date.now },
  calledAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Patient', PatientSchema);

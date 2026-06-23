import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  room: { type: String, required: true },
  avgConsultTime: { type: Number, default: 10 }, // editable by receptionist, default in minutes
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Doctor', DoctorSchema);

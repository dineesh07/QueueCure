import mongoose from 'mongoose';

const ReceptionistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['receptionist', 'admin'], default: 'receptionist' }
}, { timestamps: true });

export default mongoose.model('Receptionist', ReceptionistSchema);

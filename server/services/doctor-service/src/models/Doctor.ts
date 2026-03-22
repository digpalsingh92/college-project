import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  specialization: string;
  licenseNumber: string;
  qualifications?: string[];
  experience?: number;
  bio?: string;
  availableSlots?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  rating?: number;
  isVerified: boolean;
  isActive: boolean;
  role: 'doctor';
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    name:           { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:       { type: String, required: true, select: false },
    phone:          { type: String },
    specialization: { type: String, required: true },
    licenseNumber:  { type: String, required: true, unique: true },
    qualifications: { type: [String], default: [] },
    experience:     { type: Number, default: 0 },
    bio:            { type: String },
    availableSlots: [
      {
        day:       { type: String },
        startTime: { type: String },
        endTime:   { type: String },
      },
    ],
    rating:     { type: Number, default: 0, min: 0, max: 5 },
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },
    role:       { type: String, default: 'doctor', immutable: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);

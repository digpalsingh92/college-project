import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  medicalHistory?: string[];
  role: 'patient';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    name:           { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:       { type: String, required: true, select: false },
    phone:          { type: String },
    dateOfBirth:    { type: Date },
    gender:         { type: String, enum: ['male', 'female', 'other'] },
    address:        { type: String },
    medicalHistory: { type: [String], default: [] },
    role:           { type: String, default: 'patient', immutable: true },
    isActive:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPatient>('Patient', PatientSchema);

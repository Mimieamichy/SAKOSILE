import mongoose, { Document, Schema } from 'mongoose';


export interface ISchool extends Document {
  name: string;
  centralAdminEmail: string;
  students: number;
  staff: number;
  status: 'Active' | 'Suspended';
}

const schoolSchema = new Schema<ISchool>({
  name: { type: String, required: true },
  centralAdminEmail: { type: String, required: true, unique: true },
  students: { type: Number, default: 0 },
  staff: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
}, { timestamps: true });


export default mongoose.model<ISchool>('School', schoolSchema);
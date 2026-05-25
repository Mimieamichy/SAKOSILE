import mongoose, { Document, Schema } from 'mongoose';

export interface ILecturer extends Document {
  user: mongoose.Types.ObjectId;
  staffId: string;
  department?: string;
  faculty?: string;
  school?: string;
}

const lecturerSchema = new Schema<ILecturer>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  staffId: { type: String, required: true},
  department: { type: String, required: false },
  faculty: { type: String, required: false },
  school: { type: String, required: false },
}, { timestamps: true });

export default mongoose.model<ILecturer>('Lecturer', lecturerSchema);

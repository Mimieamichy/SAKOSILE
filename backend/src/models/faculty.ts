import mongoose, { Document, Schema } from 'mongoose';

export interface IFaculty extends Document {
  name: string;
  schoolId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const facultySchema = new Schema<IFaculty>({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true
  },
}, { 
  timestamps: true 
});

export default mongoose.model<IFaculty>('Faculty', facultySchema);
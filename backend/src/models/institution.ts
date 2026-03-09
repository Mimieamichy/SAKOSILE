import mongoose, { Document, Schema } from 'mongoose';

/**
 * 1. Institution Directory Model 
 * For the global list (UI, UNILAG, etc.) used to populate the dropdown.
 */
export interface IInstitution extends Document {
  name: string;
  type: string;
  ownership?: string;
  acronym?: string;
}

const institutionSchema = new Schema<IInstitution>({
  name: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  ownership: { type: String },
  acronym: { type: String },
}, { timestamps: true });



export default mongoose.model<IInstitution>('Institution', institutionSchema);

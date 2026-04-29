// models/readiness_form.ts
import mongoose, { Document, Schema } from 'mongoose';

// ── Template (created once by admin per school/level/stage) ──────────────────

export interface IReadinessFormTemplate extends Document {
  school: string;
  level: 'msc' | 'phd';
  stage: string;
  form: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const readinessFormTemplateSchema = new Schema<IReadinessFormTemplate>(
  {
    school:    { type: String, required: true },
    level:     { type: String, enum: ['msc', 'phd'], required: true },
    stage:     { type: String, required: true },
    form:      { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// One template per school / level / stage
readinessFormTemplateSchema.index({ school: 1, level: 1, stage: 1 }, { unique: true });

export const ReadinessFormTemplate = mongoose.model<IReadinessFormTemplate>(
  'ReadinessFormTemplate',
  readinessFormTemplateSchema
);


export interface IReadinessForm extends Document {
  student: mongoose.Types.ObjectId;
  template: mongoose.Types.ObjectId; 
  school: string;
  level: 'msc' | 'phd';
  stage: string;
  department: string;
  faculty: string;
  session: mongoose.Types.ObjectId;
  submitted: boolean;        // has the student submitted it
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const readinessFormSchema = new Schema<IReadinessForm>(
  {
    student:    { type: Schema.Types.ObjectId, ref: 'Student',             required: true },
    template:   { type: Schema.Types.ObjectId, ref: 'ReadinessFormTemplate', required: true }, 
    school:     { type: String, required: true },
    level:      { type: String, enum: ['msc', 'phd'], required: true },
    stage:      { type: String, required: true },
    department: { type: String, required: true },
    faculty:    { type: String, required: true },
    session:    { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    submitted:  { type: Boolean, default: false },
    submittedAt:{ type: Date, default: null },
  },
  { timestamps: true }
);

// One readiness form per student per stage
readinessFormSchema.index({ student: 1, stage: 1 }, { unique: true });

export default mongoose.model<IReadinessForm>('ReadinessForm', readinessFormSchema);
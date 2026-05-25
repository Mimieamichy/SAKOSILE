// models/checklist.ts
import mongoose, { Document, Schema } from 'mongoose';

// ── Template (created once by admin per school/level/stage) ──────────────────

export interface IChecklistTemplateItem extends Document{
  label: string;
  required: boolean;
}

export interface IChecklistTemplate extends Document {
  school: string;
  level: 'msc' | 'phd';
  stage: string;
  items: mongoose.Types.DocumentArray<IChecklistTemplateItem>;
  createdBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const checklistTemplateItemSchema = new Schema<IChecklistTemplateItem>({
  label:    { type: String, required: true },
  required: { type: Boolean, default: true }
});

const checklistTemplateSchema = new Schema<IChecklistTemplate>(
  {
    school:    { type: String, required: true },
    level:     { type: String, enum: ['msc', 'phd'], required: true },
    stage:     { type: String, required: true },
    items:     [checklistTemplateItemSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// One template per school / level / stage
checklistTemplateSchema.index({ school: 1, level: 1, stage: 1 }, { unique: true });

export const ChecklistTemplate = mongoose.model<IChecklistTemplate>(
  'ChecklistTemplate',
  checklistTemplateSchema
);

// ── Student Checklist Instance ────────────────────────────────────────────────

export interface IStudentChecklistEntry {
  templateItemId: mongoose.Types.ObjectId;
  label:    string;
  required: boolean;
  ticked:   boolean;
  tickedAt?: Date;
  tickedBy?: mongoose.Types.ObjectId; // the pgadmin user who ticked it
}

export interface IStudentChecklist extends Document {
  student:  mongoose.Types.ObjectId;
  template: mongoose.Types.ObjectId;
  school:   string;
  level:    'msc' | 'phd';
  stage:    string;
  entries:  IStudentChecklistEntry[];
  allComplete: boolean;
  approvedForNextStage: boolean;
  approvedBy?:  mongoose.Types.ObjectId;
  approvedAt?:  Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const studentChecklistEntrySchema = new Schema<IStudentChecklistEntry>(
  {
    templateItemId: { type: Schema.Types.ObjectId, required: true },
    label:    { type: String,  required: true },
    required: { type: Boolean, default: true },
    ticked:   { type: Boolean, default: false },
    tickedAt: { type: Date,    default: null },
    tickedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

const studentChecklistSchema = new Schema<IStudentChecklist>(
  {
    student:  { type: Schema.Types.ObjectId, ref: 'Student',           required: true },
    template: { type: Schema.Types.ObjectId, ref: 'ChecklistTemplate', required: true },
    school:   { type: String, required: true },
    level:    { type: String, enum: ['msc', 'phd'], required: true },
    stage:    { type: String, required: true },
    entries:  [studentChecklistEntrySchema],
    allComplete:          { type: Boolean, default: false },
    approvedForNextStage: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One checklist per student per stage
studentChecklistSchema.index({ student: 1, stage: 1 }, { unique: true });

export default mongoose.model<IStudentChecklist>('StudentChecklist',studentChecklistSchema);

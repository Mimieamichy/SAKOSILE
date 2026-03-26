import mongoose, { Document, Schema } from 'mongoose';

/**
 * Represents a single score on a specific criterion by a panel member
 */
export interface ICriterionScore {
  criterion: string; // will reference criterion._id or criterion.name
  score: number; // 0-100
}

/**
 * Represents a single student's scores across multiple criteria by a panel member
 */
export interface IScoreEntry {
  student: mongoose.Types.ObjectId;
  panelMember: mongoose.Types.ObjectId;
  defence: mongoose.Types.ObjectId;
  scores: ICriterionScore[];
}

/**
 * ScoreSheet is tied to a Defence.
 * Holds criteria definitions and panel scoring entries.
 */
export interface IScoreSheet extends Document {
  faculty: { type: string; required: true; unique: true };
  level: 'msc' | 'phd';
  stage: string;

  criteria: {
    _id: mongoose.Types.ObjectId; 
    name: string;
    weight: number;
  }[];
  entries: IScoreEntry[];
  isActive: { type: Boolean, default: true },
}

// riteria sub-schema with auto _id enabled
const criterionSchema = new Schema<{ name: string; weight: number }>(
  {
    name: { type: String, required: true },
    weight: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: true } // enable _id for each criterion
);

const criterionScoreSchema = new Schema<ICriterionScore>(
  {
    criterion: { type: String, required: true }, // could be changed later to ObjectId reference
    score: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const scoreEntrySchema = new Schema<IScoreEntry>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    panelMember: { type: Schema.Types.ObjectId, ref: 'Lecturer', required: true },
    defence: { type: Schema.Types.ObjectId, ref: 'Defence', required: true },
    scores: {
      type: [criterionScoreSchema],
      validate: {
        validator: (arr: ICriterionScore[]) => {
          const crits = arr.map((s) => s.criterion);
          return new Set(crits).size === crits.length;
        },
        message: 'Duplicate criteria in scores are not allowed',
      },
    },
  },
  { _id: false }
);

const scoreSheetSchema = new Schema<IScoreSheet>(
  {
    faculty: { type: String, required: true, unique: true },
    level: {
      type: String,
      enum: ['msc', 'phd'],
      required: true,
    },
    stage: { type: String, required: true },
    criteria: {
      type: [criterionSchema],
      validate: [
        {
          validator: (arr: { name: string; weight: number }[]) => {
            const names = arr.map((c) => c.name);
            if (new Set(names).size !== names.length) return false;
            const total = arr.reduce((sum, c) => sum + c.weight, 0);
            return total === 100;
          },
          message: 'Criteria must have unique names and weights summing to 100',
        },
      ],
    },
    entries: [scoreEntrySchema], // initially empty
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IScoreSheet>('ScoreSheet', scoreSheetSchema);

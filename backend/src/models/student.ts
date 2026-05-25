import mongoose, { Document, Schema } from 'mongoose';

export interface IStageScores {
  // PHD stages
  proposalDefenceScore?: number;
  secondSeminarScore?: number;
  thirdSeminarScore?: number;
  externalDefenseScore?: number;

  // MSC stages
  proposalScore?: number;
  internalScore?: number;
  externalScore?: number;
}

export interface IStudent extends Document {
  user: mongoose.Types.ObjectId;
  matricNo: string;
  level: 'msc' | 'phd';
  currentStage: string;
  department: string;
  faculty: string;
  school: string;
  session: mongoose.Types.ObjectId;
  majorSupervisor?: mongoose.Types.ObjectId;
  minorSupervisor?: mongoose.Types.ObjectId;
  internalExaminer?: mongoose.Types.ObjectId;
  collegeRep?: mongoose.Types.ObjectId;
  projectTopic?: string;
  defenceMarked: Boolean;
  stageScores: IStageScores;
  createdAt?: Date;
  updatedAt?: Date;
}


const stageScoresSchema = new Schema<IStageScores>(
  {
    // PHD stages
    proposalDefenceScore: { type: Number, min: 0, max: 100, default: 0 },
    secondSeminarScore: { type: Number, min: 0, max: 100, default: 0 },
    thirdSeminarScore: { type: Number, min: 0, max: 100, default: 0 },
    externalDefenseScore: { type: Number, min: 0, max: 100, default: 0 },

    // MSC stages
    proposalScore: { type: Number, min: 0, max: 100, default: 0 },
    internalScore: { type: Number, min: 0, max: 100, default: 0 },
    externalScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

const studentSchema = new Schema<IStudent>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    matricNo: { type: String, required: true, unique: true },
    level: { type: String, enum: ['msc', 'phd'], required: true },
    currentStage: { type: String, default: 'start' },
    department: { type: String, required: true },
    faculty: { type: String, required: true },
    school: { type: String, required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    majorSupervisor: { type: Schema.Types.ObjectId, ref: 'Lecturer', default: null },
    minorSupervisor: { type: Schema.Types.ObjectId, ref: 'Lecturer', default: null },
    internalExaminer: { type: Schema.Types.ObjectId, ref: 'Lecturer', default: null },
    collegeRep: { type: Schema.Types.ObjectId, ref: 'Lecturer', default: null },
    projectTopic: { type: String, default: '' },
    defenceMarked: {type: Boolean, default: true},
    stageScores: { type: stageScoresSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model<IStudent>('Student', studentSchema);

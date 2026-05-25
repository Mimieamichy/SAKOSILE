// shared/models/ActivityLog.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  actor: mongoose.Types.ObjectId;   // User who performed the action
  name: string;                     // Their name (Dr. Ibah Ibah, Prof. Mercy Amaefule, Hannah Musa etc.)
  role: string;                     // Their role (Admin, Supervisor, Student etc.)
  action: string;                   // What they did
  entity: string;                   // Affected entity e.g. "Student", "Defence"
  department: string;               // Department of the actor
  school?: string;                 // School of the actor 
  timestamp: Date;                  // When it happened
}

const ActivityLogSchema = new Schema<IActivityLog>({
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  department: { type: String, required: true },
  school: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

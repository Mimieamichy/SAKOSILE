import mongoose, { Document, Schema } from "mongoose";

export interface ISchool extends Document {
  name: string;
  domain?: string;
  logo?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schoolSchema = new Schema<ISchool>(
  {
    name: {
      type: String,
      required: true
    },
    domain: {
      type: String
    },
    logo: {
      type: String
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export const School = mongoose.model<ISchool>("School", schoolSchema);
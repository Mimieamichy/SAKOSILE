import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Role } from '../utils/permissions';

export interface IUser extends Document {
  email: string;
  password: string;
  roles: string[];
  firstName: string;
  lastName: string;
  title?:string;
  permissions?: string[];
  isPanelMember: Boolean;
  schoolId: mongoose.Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: { type: [String], required: true, default: [Role.GENERAL] }, 
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    title: { type: String, required: false },
    isPanelMember: { type: Boolean, default: false },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: false },
  },
  { timestamps: true }
);



// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Add comparePassword method
// Add comparePassword method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  console.log('--- Inside comparePassword ---');
  console.log('Candidate Password:', candidatePassword);
  console.log('Stored Hashed Password:', this.password);
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Passwords Match:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error during password comparison:', error);
    return false; // Or rethrow, depending on desired error handling
  }
};

export default mongoose.model<IUser>('User', userSchema);

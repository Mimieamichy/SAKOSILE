import readline from 'readline';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/index'
import { Role } from './src/utils/permissions';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(process.env.MONGO_URI)
console.log(process.env.MONGO_URI ? 'Connecting to MongoDB...' : 'No MONGO_URI provided. Exiting...');

async function prompt(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('Connected to DB ✅');

    const email = await prompt('Enter admin email: ');
    const password = await prompt('Enter admin password: ');



    const existing = await User.findOne({ email });
    if (existing) {
      console.log('❌ Admin already exists with this email.');
      rl.close();
      process.exit(0);
    }

    const admin = await User.create({
      email,
      password: password,
      roles: [Role.SUPER_ADMIN, Role.GENERAL],
      firstName: 'Super',
      lastName: 'Admin',
      isPanelMember: false,
    });

    console.log(`✅ Admin created: ${admin.email}`);
    rl.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    rl.close();
    process.exit(1);
  }
}

createAdmin();

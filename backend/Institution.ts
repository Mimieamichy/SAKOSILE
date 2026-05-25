import mongoose from 'mongoose';
import { Institution } from './src/models/index'; 
import nigerianUniversities from './universities.json';

import dotenv from 'dotenv';
dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect((process.env.MONGO_URI || 'mongodb://localhost:27017/saas_db'));
    console.log('✅ Connected to MongoDB');

    const operations = nigerianUniversities.map(uni => ({
      updateOne: {
        filter: { name: uni.name },
        update: uni,
        upsert: true
      }
    }));

    await Institution.bulkWrite(operations);
    console.log('✅ Institution directory seeded successfully');
    
    process.exit();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
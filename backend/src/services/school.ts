import { Role } from '../utils/permissions';
import { School, User } from '../models/index';
import { Types } from 'mongoose';

export default class SchoolService {
  // Add a new school/tenant
  static async addSchool(schoolData: { name: string; centralAdminEmail: string; firstName: string; lastName: string }) {
    // 1. Create the School record first to get its ID
    const newSchool = await School.create({
      name: schoolData.name,
      centralAdminEmail: schoolData.centralAdminEmail,
      status: 'Active'
    });

    // 2. Create the Admin User and link the schoolId
    await User.create({
      email: schoolData.centralAdminEmail,
      password: schoolData.centralAdminEmail, // Hashed automatically by your User model's pre-save hook
      firstName: schoolData.firstName,
      lastName: schoolData.lastName,
      roles: [Role.ADMIN, Role.GENERAL],
      schoolId: newSchool._id, 
    });

    return newSchool;
  }

  // Toggle status for School or User
  static async updateStatus(model: 'school' | 'user', id: string, status: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ID format.');
    
    if (model === 'school') {
      return await School.findByIdAndUpdate(
        new Types.ObjectId(id),
        { status },
        { new: true }
      );
    } else {
      return await User.findByIdAndUpdate(
        new Types.ObjectId(id),
        { status },
        { new: true }
      );
    }
  }

  // Get all users + totals for each role
  static async getSystemUsersReport() {
    const users = await User.find().select('-password'); // Exclude sensitive data
    
    // Aggregation to get counts by role
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: "$role", // Groups by the 'role' field in your User model
          total: { $sum: 1 }
        }
      }
    ]);

    return { users, roleStats };
  }

  //Get all schools
  static async getAllSchools() {
    return await School.find();
  }

  // Get school by ID
  static async getSchoolById(schoolId: string) {
    if (!Types.ObjectId.isValid(schoolId)) throw new Error('Invalid ID format.');
    return await School.findById(new Types.ObjectId(schoolId));
  }

  static async incrementCount( schoolName: string, type: 'students' | 'staff') {
  return await School.findOneAndUpdate(
    { name: schoolName },
    { $inc: { [type]: 1 } },
    { new: true }
  );
}
}
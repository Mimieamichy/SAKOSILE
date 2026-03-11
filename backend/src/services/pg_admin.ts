import { User } from "../models/index";
import bcrypt from "bcryptjs";
import { Role } from '../utils/permissions';

export default class PGAdminService {
    static async createAdmin(adminData: any) {
    const { email, firstName, lastName, title, schoolId } = adminData;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // 2. Create the new user and push the PG Admin role
    const newAdmin = new User({
      email,
      firstName,
      lastName,
      title,
      schoolId,
      roles:  [Role.PG_ADMIN, Role.GENERAL],
      isPanelMember: false
    });

    await newAdmin.save();

    return newAdmin;
  }
}



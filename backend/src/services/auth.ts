// src/services/AuthService.ts
import { User, Student, Lecturer, School } from '../models/index';
import jwt from 'jsonwebtoken';
import EmailService from '../utils/helpers';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const RESET_TOKEN_EXPIRY = '1h';
import { getPermissionsFromRoles } from '../utils/helpers';
import { Role } from '../utils/permissions';
import UserService from './user';



export const blacklistTokens: string[] = [];



export default class AuthService {
  static async login(email: string, password: string) {

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid credentials');
    }

    const roles = user.roles as Role[];
    const permissions = getPermissionsFromRoles(roles);

    const isSuperAdmin = roles.includes(Role.SUPER_ADMIN);

    // Non platform users must belong to a school
    if (!isSuperAdmin && !user.schoolId) {
      throw new Error("User is not assigned to a school");
    }



    let department = "none";
    let faculty = "none";
    let lecturerId = "none";
    let schoolName = "none";

    if (roles.includes(Role.ADMIN)){
      const school = await School.findById(user.schoolId);
      schoolName = school?.name || 'none';
    }

    // STUDENT LOGIC
    if (roles.includes(Role.STUDENT)) {

      const student = await Student.findOne({ user: user._id });

      if (!student) {
        throw new Error('Inconsistency: user has STUDENT role but no Student record found');
      }

      department = student.department;
      faculty = student.faculty;
      schoolName = student.school;
    }

    // LECTURER / STAFF LOGIC
    if (
      roles.includes(Role.LECTURER) ||
      roles.includes(Role.HOD) ||
      roles.includes(Role.PROVOST) ||
      roles.includes(Role.PGCOORD) ||
      roles.includes(Role.DEAN)
    ) {

      const lecturer = await Lecturer.findOne({ user: user._id });

      if (!lecturer) {
        throw new Error('Inconsistency: user has lecturer role but no Lecturer record found');
      }

      department = lecturer.department || "none";
      faculty = lecturer.faculty || "none";
      const school = await School.findById(user.schoolId);
      schoolName = school?.name || 'none';
      lecturerId = String(lecturer._id);
    }

    const token = jwt.sign(
      {
        id: user._id,
        school: schoolName,
        roles,
        permissions,
        department,
        faculty
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        isPanelMember: user.isPanelMember,
        school: schoolName || null,
        department,
        faculty,
        lecturer: lecturerId
      },
      token
    };
  }

  static async logout(token: string) {
    blacklistTokens.push(token);
    return;
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('No account with that email found');
    }

    const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: RESET_TOKEN_EXPIRY });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await EmailService.sendPasswordReset(email, resetUrl);
    return;
  }

  static async resetPassword(token: string, newPassword: string) {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid token');
    }
    user.password = newPassword;
    await user.save();
    return;
  }




}




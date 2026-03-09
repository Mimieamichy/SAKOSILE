import { User, Lecturer, Student } from "../models/index";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export default class UserService {
    static async getUserProfile(userId: string) {
        const user = await User.findById(userId).lean();
        if (!user) throw new Error('User not found');

        const profile: any = { user };

        if ((user.roles).includes('lecturer')) {
            const lecturer = await Lecturer.findOne({ user: user._id }).lean();
            if (lecturer) profile.lecturer = lecturer;
        } else if ((user.roles).includes('student')) {
            const student = await Student.findOne({ user: user._id }).lean();
            if (student) profile.student = student;
        }

        return profile;
    }

    static async updatePassword(userId: string, oldPassword: string, newPassword: string) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) throw new Error('Old password is incorrect');

        user.password = newPassword;

        await user.save();
        return;
    }

    
    static async getUserById(userId: string) {
        const user = await User.findById(userId)
            .populate('schoolId', 'name') 
            .lean();

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }
   
}
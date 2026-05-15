import { Request, Response } from 'express';
import StudentService from "../services/students";
import ActivityLogService from '../services/activity_log';
import UserService from '../services/user'
import { Types } from "mongoose";
import {STAGES} from '../utils/constants'


export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string[];
    permissions: string[];
    [key: string]: any;
  };
}

export default class StudentController {
  static async addStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const { firstName, lastName, email, degree: level, matNo: matricNo, session, projectTopic } = req.body;
      const userId = req.user?.id || ''
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`;
      const newStudent = await StudentService.addStudent({
        firstName,
        lastName,
        email,
        level,
        matricNo,
        userId,
        session,
        projectTopic,
        school,
      });
      const studentData = await StudentService.getOneStudent(String(newStudent._id))
      if (!studentData) {
        res.status(404).json({ success: false, error: 'Student not found' });
        return
      }
      await ActivityLogService.logActivity(userId, userName, role, 'added', `student ${firstName} ${lastName} with Matric No: (${matricNo})`, studentData.department, school);
      res.status(201).json({ success: true, data: newStudent });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to add student', message: err.message});
    }
  }

  static async getOneStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId } = req.params
      const student = await StudentService.getOneStudent(studentId);
      res.status(200).json({ success: true, data: student });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to get student', message: err.message});
    }
  }

  static async getOneStudentByUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || ''
      const student = await StudentService.getOneStudentByUser(userId);
      res.status(200).json({ success: true, data: student });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to get student', message: err.message});
    }
  }

  static async getStudents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { level, department, session, stage } = req.params;

      if (!['msc', 'phd'].includes(level)) {
        res.status(400).json({ success: false, error: 'Invalid level. Must be msc or phd' });
        return
      }

      if (level === 'msc' && !Object.values(STAGES.MSC).includes(stage)) {
        res.status(400).json({ success: false, error: `Invalid stage for MSC. Must be one of: ${Object.values(STAGES.MSC).join(', ')}` });
        return;
      }
      if (level === 'phd' && !Object.values(STAGES.PHD).includes(stage)) {
        res.status(400).json({ success: false, error: `Invalid stage for PHD. Must be one of: ${Object.values(STAGES.PHD).join(', ')}` });
        return;
      }
      
      const userId = req.user?.id || '';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sessionId = new Types.ObjectId(session);

      const students = await StudentService.getStudents(
        level as 'msc' | 'phd',
        department,
        userId,
        sessionId,
        stage,
        page,
        limit
      );

      res.status(200).json({ success: true, data: students });
    } catch (err: any) {
      console.error(err);
      res.status(400).json({success: false, error: 'Failed to get students', message: err.message});
    }
  }

  static async assignSupervisor(req: AuthenticatedRequest, res: Response) {
    try {
      const { staffId, staffName, type } = req.body
      const { studentId } = req.params;
      const userId = req.user?.id || ''
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`;
      const studentData = await StudentService.getOneStudent(studentId)
      if (!studentData) {
        res.status(404).json({ success: false, error: 'Student not found' });
        return
      }
      const assignedStudent = await StudentService.assignSupervisor(staffId, staffName, type, studentId)
      await ActivityLogService.logActivity(userId, userName, role, 'assigned', `${type} supervisor ${staffName} to ${studentData.user.firstName} ${studentData.user.lastName} with Matric No: (${studentData.matricNo})`, studentData.department, school);
      res.status(201).json({ success: true, data: assignedStudent });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to assign supervisors', message: err.message});
    }
  }

  static async getStudentsBySupervisorMsc(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '';
      const students = await StudentService.getStudentsBySupervisorMsc(userId);
      res.status(200).json({ success: true, data: students });
    } catch (err: any) {
      console.error(err);
      res.status(400).json({
        success: false,
        error: 'Failed to get students',
        message: err.message,
      });
    }
  }


  static async getStudentsBySupervisorPhd(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '';
      const students = await StudentService.getStudentsBySupervisorPhd(userId);
      res.status(200).json({ success: true, data: students });
    } catch (err: any) {
      console.error(err);
      res.status(400).json({
        success: false,
        error: 'Failed to get students',
        message: err.message,
      });
    }
  }

  static async editStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const { matricNo, firstName, lastName, projectTopic } = req.body;
      const userId = req.user?.id || ''
      console.log('userID', req.user)
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      console.log(user)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`;
      const updatedStudent = await StudentService.editStudent(studentId, {matricNo,firstName,lastName,projectTopic });
      const studentData = await StudentService.getOneStudent(studentId)
      if (!studentData) {
        res.status(404).json({ success: false, error: 'Student not found' });
        return
      }
      await ActivityLogService.logActivity(userId, userName, role, 'updated', `${firstName} ${lastName} with Matric No: (${matricNo}) data`, studentData.department, school);
      res.status(200).json({ success: true, data: updatedStudent });
    } catch (err: any) {
      console.error(err);
      res.status(400).json({success: false, error: 'Failed to update student', message: err.message});
    }
  }

  static async deleteStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const userId = req.user?.id || ''
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`;
      const studentData = await StudentService.getOneStudent(studentId);
      if (!studentData) {
        res.status(404).json({ success: false, error: 'Student not found' });
        return 
      }
      const { deletedStudent, deletedUser } = await StudentService.deleteStudent(studentId);
      await ActivityLogService.logActivity(userId, userName, role, 'deleted a student', `${studentData.user.firstName} ${studentData.user.lastName} with Matric No: (${studentData.matricNo})`, studentData.department, school);
      res.status(200).json({ success: true, data: deletedStudent, deletedUser });
    } catch (err: any) {
      console.error(err);
      res.status(400).json({success: false, error: 'Failed to delete student', message: err.message});
    }
  }

  static async assignCollegeRep(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId, staffId } = req.params;
      const userId = req.user?.id || ''
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`;
      const { updatedLecturer, updatedStudent } = await StudentService.assignCollegeRep(staffId, studentId)
      const studentData = await StudentService.getOneStudent(studentId);
      if (!studentData) {
        res.status(404).json({ success: false, error: 'Student not found' });
        return 
      }
      await ActivityLogService.logActivity(userId, userName, role, 'assigned', `college rep to ${studentData.user.firstName} ${studentData.user.lastName} with Matric No: (${studentData.matricNo})`, studentData.department,school);
      res.status(200).json({ success: true, data: updatedStudent, updatedLecturer });
    } catch (err: any) {
      console.error(err);
      res.status(400).json({success: false, error: 'Failed to assign college rep',message: err.message});
    }
  }


}
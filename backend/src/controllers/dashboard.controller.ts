// domain/dashboard/dashboard.controller.ts
import { Request, Response } from "express";
import {Student, Lecturer, Department, Faculty, Session, Defence, Notification} from "../models/index";


export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string[];
    permissions: string[];
    [key: string]: any;
  };
}


export default class DashboardController {
  // 1. Assigned students for a supervisor
  static async getAssignedStudents(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id; 

      // First, find the lecturer associated with this user
    const lecturer = await Lecturer.findOne({ user: userId }) ;
    if (!lecturer) {
       res.status(404).json({ 
        success: false, 
        error: 'Lecturer profile not found' 
      });
       return;
    }
      const students = await Student.find({
  $or: [
    { majorSupervisor: lecturer._id },
    { minorSupervisor: lecturer._id },
    { collegeRep: lecturer._id },
    { internalExaminer: lecturer._id }
  ]
});
      res.json({ success: true, count: students.length });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to get assigned students', message: err.message});
    }
  }

  // 2. Upcoming defences
  static async getUpcomingDefences(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '';
      const lecturer = await Lecturer.findOne({ user: userId });
    if (!lecturer) {
       res.status(404).json({ 
        success: false, 
        error: 'Lecturer profile not found' 
      }); return
    }
      
      const defences = await Defence.find({ ended: false, panelMembers: lecturer._id })
      res.json({ success: true, count: defences.length, defences });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to get upcoming defences', message: err.message});
    }
  }

  // 3. Notifications for a user
  static async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '';
      const notifications = await Notification.countDocuments({ recipient: userId, read: false })
      res.json({ success: true, count: notifications, notifications });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to get notifications', message: err.message});
    }
  }

  // 4. Number of lecturers in department
  static async countLecturersInDept(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id || '';
    const lecturerDept = await Lecturer.findOne({ user: userId }).select('department');
    const dept = lecturerDept?.department;

    if (!dept) {
      res.status(404).json({ success: false, message: "Lecturer department not found" }); 
    }

    const countResult = await Lecturer.aggregate([
      { $match: { department: dept } },
      {
        $lookup: {
          from: 'users', // collection name for your User model
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.roles': { $ne: 'external_examiner' } } },
      { $count: 'total' }
    ]);

    const count = countResult.length > 0 ? countResult[0].total : 0;

    res.json({ success: true, count });
  } catch (err: any) {
    console.log(err);
    res.status(400).json({success: false, error: 'Failed to get lecturers in a department', message: err.message});
  }
}


  // 5. Number of lecturers in faculty
  static async countLecturersInFaculty(req: AuthenticatedRequest, res: Response) {
      try {
      const userId = req.user?.id || '';
      const lecturerDept = await Lecturer.findOne({user: userId}).select('faculty');
      const faculty = lecturerDept?.faculty;
      const count = await Lecturer.countDocuments({ faculty });
      res.json({ success: true, count });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to get lecturers in a faculty', message: err.message});
    }
  }

  // 6. Number of students in department
  static async countStudentsInDept(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '';
      const lecturerDept = await Lecturer.findOne({user: userId}).select('department');
      const dept = lecturerDept?.department;
      const count = await Student.countDocuments({ department: dept });
      res.json({ success: true, count });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to get students in a department', message: err.message});
    }
  }

  // 7. Number of students in faculty
  static async countStudentsInFaculty(req: AuthenticatedRequest, res: Response) {
     try {
      const userId = req.user?.id || '';
      const lecturerDept = await Lecturer.findOne({user: userId}).select('faculty');
      const faculty = lecturerDept?.faculty;
      const count = await Student.countDocuments({ faculty });
      res.json({ success: true, count });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to get students in a faculty', message: err.message});
    }
  }

  // 8. Number of active sessions
  static async countActiveSessions(req: AuthenticatedRequest, res: Response) {
    try {
      const count = await Session.countDocuments({ isActive: true });
      res.json({ success: true, count });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to add student', message: err.message});
    }
  }

  // 9. Number of departments in faculty
  static async countDepartmentsInFaculty(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;

    // Step 1: find lecturer
    const lecturer = await Lecturer.findOne({ user: userId }).select('faculty');
    if (!lecturer) {
       res.status(404).json({ success: false, error: 'Lecturer profile not found' });
       return
    }

    // Step 2: find faculty document using lecturer.faculty (string)
    const faculty = await Faculty.findOne({ name: lecturer.faculty }).select('_id');
    if (!faculty) {
      res.status(404).json({ success: false, error: 'Faculty not found' });
      return
    }

    console.log(faculty._id, lecturer.faculty);

    // Step 3: count departments with facultyId
    const count = await Department.countDocuments({ faculty: faculty._id });

    res.json({ success: true, count });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({
      success: false,
      error: 'Failed to get departments in faculty',
      message: err.message,
    });
  }
}


  // 10. Number of college Reps in the school
 static async countCollegeReps(req: AuthenticatedRequest, res: Response) {
  try {
    // Get all lecturers with their user roles populated
    const lecturers = await Lecturer.find()
      .populate({ path: 'user', select: 'roles', model: 'User' });

    // Filter lecturers whose user has the 'college_rep' role
    const collegeReps = lecturers.filter(
      lect => lect.user && typeof lect.user === 'object' && Array.isArray((lect.user as any).roles) && (lect.user as any).roles.includes('college_rep')
    );

    // Count and return
    const count = collegeReps.length;
    res.json({ success: true, count });

  } catch (err: any) {
    console.error(err);
    res.status(400).json({success: false, error: 'Failed to count college reps', message: err.message});
  }
}

// 11. Number of external examiners in the school 
static async countExternalExaminers(req: AuthenticatedRequest, res: Response) {
  try {
    // Get all lecturers with their user roles populated
    const lecturers = await Lecturer.find()
      .populate({ path: 'user', select: 'roles', model: 'User' });

    // Filter lecturers whose user has the 'college_rep' role
    const collegeReps = lecturers.filter(
      lect => lect.user && typeof lect.user === 'object' && Array.isArray((lect.user as any).roles) && (lect.user as any).roles.includes('external_examiner')
    );

    // Count and return
    const count = collegeReps.length;
    res.json({ success: true, count });

  } catch (err: any) {
    console.error(err);
    res.status(400).json({success: false, error: 'Failed to count external examiners', message: err.message});
  }
}

}

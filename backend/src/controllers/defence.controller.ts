import { Request, Response } from 'express';
import DefenceService from '../services/defence';
import ActivityLogService from '../services/activity_log';
import StudentService from '../services/students';
import UserService from '../services/user';



export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string[];
    permissions: string[];
    [key: string]: any;
  };
}
export default class DefenceController {
  static async getAllDefences(req: Request, res: Response) {
    try {
      const defences = await DefenceService.getAllDefenses();
      res.json({ success: true, data: defences });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Failed to get all defences', message: err.message });
    }
  }

  /** Schedule a new defence */
  static async scheduleDefence(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '';
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`;

      const defence = await DefenceService.scheduleDefence(req.body);
      await ActivityLogService.logActivity(userId, userName, role, "Scheduled",  `Defence for ${defence.program} for stage ${defence.stage}`, defence.department, school);
      res.json({ success: true, data: defence });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Failed to schedule defence', message: err.message });
    }
  }

  /** Start a defence */
  static async startDefence(req: AuthenticatedRequest, res: Response) {
    try {
      const { defenceId } = req.params;
      const userId = req.user?.id || '';
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`;
      
      const defence = await DefenceService.startDefence(defenceId);
      await ActivityLogService.logActivity(userId, userName, role, "Started",  `Defence for ${defence.program} for stage ${defence.stage}`, defence.department, school);
      res.json({ success: true, data: defence });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false,error: 'Failed to start defence',message: err.message});
    }
  }

  /** Submit score for a student by a panel member */
  static async submitScore(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId, panelMemberId, scores } = req.body;
      const { defenceId } = req.params;
      const userId = req.user?.id || '';
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`;

      const studentData = await StudentService.getOneStudent(studentId);
      if (!studentData) {
        res.status(404).json({ success: false, error: 'Student not found' });
        return
      }
      const sheet = await DefenceService.submitScore(defenceId, panelMemberId,studentId,scores);
      await ActivityLogService.logActivity(userId, userName, role, "Submitted Score for", `${studentData.user.firstName} ${studentData.user.lastName} with Matric No: ${studentData.matricNo} for defence`, studentData.department, school);
      res.json({ success: true, data: sheet });
    } catch (err: any) {
      res.status(400).json({success: false, error: 'Failed to submit score', message: err.message});
    }
  }

  /** End a defence and compute averages */
  static async endDefence(req: AuthenticatedRequest, res: Response) {
    try {
      const { defenceId } = req.params;
      const userId = req.user?.id || '';
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`;
      const defence = await DefenceService.endDefence(defenceId);
      await ActivityLogService.logActivity(userId, userName, role, "Ended", "Defence", defence.department, school);
      res.json({ success: true, data: defence});
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Failed to end defence', message: err.message });
    }
  }


  /** Approve defence for a student */
  static async approveStudentDefence(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const userId = req.user?.id || '';
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`;
      
      const studentData = await StudentService.getOneStudent(studentId);
      if (!studentData) {
        res.status(404).json({ success: false, error: 'Student not found' });
        return
      }
      const student = await DefenceService.approveStudentDefence(studentId);
      await ActivityLogService.logActivity(userId, userName, role, "Approved",   `Defence for ${studentData.user.firstName} ${studentData.user.lastName} with matric No: ${studentData.matricNo}`, studentData.department, school);
      res.json({ success: true, data: student });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Failed to approve defence for student', message: err.message });
    }
  }


  /** Reject defence for a student */
  static async rejectStudentDefence(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const userId = req.user?.id || '';
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`;
      
      const studentData = await StudentService.getOneStudent(studentId);
      if (!studentData) {
        res.status(404).json({ success: false, error: 'Student not found' });
        return
      }
      const student = await DefenceService.rejectStudentDefence(studentId);
      await ActivityLogService.logActivity(userId, userName, role, "Rejected", `Defence for ${studentData.user.firstName} ${studentData.user.lastName} with matric No: ${studentData.matricNo}`, studentData.department, school);
      res.json({ success: true, data: student });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Failed to reject defence for student', message: err.message });
    }
  }

  /** Get a defence with student details */
  static async getDefenceDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { defenceId } = req.params;
      const panelMemberId = req.user?.id || '';
      const defence = await DefenceService.getDefenceDetails(defenceId, panelMemberId);
      res.json({ success: true, data: defence });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Failed to get defence details', message: err.message });
    }
  }

  /**GEt most recent defence */
  static async getDefenceForPanelMember(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '';
      const { level } = req.params
      const defence = await DefenceService.getDefenceForPanelMember(level, userId);
      res.json({ success: true, data: defence });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({ success: false, error: 'Failed to get most recent defence', message: err.message });
    }
  }

  /**Get lecturers in a department who aint panel members */
   static async getAvailableLecturersForDefence(req: AuthenticatedRequest, res: Response) {
    try {
      const {stage, level, department} = req.params

      const lecturers = await DefenceService.getAvailableLecturersForDefence({stage, level, department});
      res.json({ success: true, data: lecturers });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({ success: false, error: 'Failed to schedule defence', message: err.message });
    }
  }

}


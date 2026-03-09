import UserService from '../services/user';
import ActivityLogService from '../services/activity_log'
import SchoolService from '../services/school';
import { Request, Response } from 'express';
import Lecturer from '../models/lecturer';


export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string[];
    permissions: string[];
    [key: string]: any;
  };
}


export default class UserController {
  static async getUserProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.getUserProfile(req.user?._id);
      res.json({ success: true, data: user });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({ success: false, error: 'Failed to get User profile', message: err.message });
    }
  }

  static async updatePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user?.id || ""
      await UserService.updatePassword(userId, oldPassword, newPassword);
      res.json({ success: true, data: newPassword });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({ success: false, error: 'Failed to get update password', message: err.message });
    }
  }

  static async getAllLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const { search } = req.query;
      const roles = req.user?.role || [];
      const userId = req.user?.id;
      const school = req.user?.school;

      let logs;

      // 1. Platform-wide Admin (Optional: Sees everything)
      if (roles.includes("system_admin")) {
        logs = await ActivityLogService.getAllLogs(search as string);
      } 
      
      // 2. School-level Super Admin (Sees logs for their specific school)
      else if (roles.includes("super_admin")) {
        if (!school) {
          res.status(400).json({ success: false, error: "School context missing for Super Admin" });
          return;
        }
        logs = await ActivityLogService.getLogsForSchool(school.toString(), search as string);
      } 
      
      // 3. Department HOD (Sees logs for their specific department)
      else if (roles.includes("hod")) {
        const lecturer = await Lecturer.findOne({ user: userId }).select("department");
        
        if (!lecturer?.department) {
          res.status(400).json({ success: false, error: "No department found for this HOD" });
          return;
        }
        
        logs = await ActivityLogService.getLogsForHOD(lecturer.department.toString(), search as string);
      } 
      
      // 4. Unauthorized roles
      else {
        res.status(403).json({ success: true, error: "Unauthorized access to activity logs" });
        return;
      }

      res.json({ success: true, data: logs });

    } catch (err: any) {
      console.error("Activity Log Error:", err);
      res.status(400).json({ 
        success: false, 
        error: 'Failed to fetch Activity Logs', 
        message: err.message 
      });
    }
  }


  static async toggleUserStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body; // Expecting "Active" or "Suspended"
      const data = await SchoolService.updateStatus('user', id, status);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // GET: Users and Role Totals
  static async getUsersAndStats(req: Request, res: Response) {
    try {
      const report = await SchoolService.getSystemUsersReport();
      res.json({ success: true, data: report });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

}

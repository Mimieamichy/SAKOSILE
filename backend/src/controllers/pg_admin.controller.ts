import { Request, Response } from 'express';
import PGAdminService from '../services/pg_admin';


export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string[];
    permissions: string[];
    [key: string]: any;
  };
}

export default class PGAdminController {
    static async createAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, firstName, lastName, title } = req.body;
      const userId = req.user?.id;
      const newAdmin = await PGAdminService.createAdmin({ email, firstName, lastName, title, userId });
      
      res.status(201).json({ 
        success: true, 
        message: 'PG Admin created successfully',
        data: newAdmin 
      });
    } catch (err: any) {
      console.error("Create Admin Error:", err);
      res.status(400).json({ 
        success: false, 
        error: 'Failed to create admin', 
        message: err.message 
      });
    }
  }

  static async getAllAdmins(req: AuthenticatedRequest, res: Response) {
    try {
      const admins = await PGAdminService.getAllAdmins();
      res.status(200).json({ success: true, data: admins });
    } catch (err: any) {
      console.error("Get Admins Error:", err);
      res.status(500).json({ success: false, error: 'Failed to retrieve admins', message: err.message });
    }
  }

}
  
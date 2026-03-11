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
      // You can extract req.body directly since we aren't using DTOs
      const newAdmin = await PGAdminService.createAdmin(req.body);
      
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

}
  
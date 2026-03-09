import { Request, Response } from 'express';
import SchoolService from '../services/school';

export default class SchoolController {
  // POST: Add School
  static async addSchool(req: Request, res: Response) {
    try {
      const data = await SchoolService.addSchool(req.body);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // PATCH: Update School Status
  static async toggleSchoolStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body; // Expecting "Active" or "Suspended"
      const data = await SchoolService.updateStatus('school', id, status);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getAllSchols(req: Request, res: Response) {
    try {
      const data = await SchoolService.getAllSchools();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }


  
}
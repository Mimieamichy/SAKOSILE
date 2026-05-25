import { Request, Response } from 'express';
import InstitutionService from '../services/instiutions'


export default class InstitutionController {
  static async getAllInstitutions(req: Request, res: Response) {
    try {
      const institutions = await InstitutionService.getAllInstitutions();
      res.json({ success: true, data: institutions });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({ success: false, error: 'Failed to fetch Institutions.', message: err.message });
    }
  }

}
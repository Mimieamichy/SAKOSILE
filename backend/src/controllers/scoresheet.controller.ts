import { Request, Response } from 'express';
import ScoreSheetService from '../services/scoresheet';
import ActivityLogService from '../services/activity_log'
import UserService from '../services/user';
import LecturerService from '../services/lecturer';



export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string[];
    permissions: string[];
    [key: string]: any;
  };
}
export default class ScoreSheetController {
    
    
/** Create a department-wide template score sheet */
  static async createFacultyScoreSheet(req: AuthenticatedRequest, res: Response) {
    try {
      const { criteria, level, stage } = req.body;
      const userId = req.user?.id || ''
      const role = req.user?.role[0] || ''
      const school = req.user?.school || '' 
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`

      const lecturer = await LecturerService.getLecturerById(userId)
      const faculty = lecturer?.faculty || 'N/A'
      
      const scoreSheet = await ScoreSheetService.createFacultyScoreSheet(criteria, level, stage, userId);
      await ActivityLogService.logActivity(userId, userName, role, 'created a Faculty ', 'Score sheet for', faculty , school);
      res.json({ success: true, data: scoreSheet });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to create department score sheet', message: err.message});
    }
  }


   static async getSingleFacultyScoreSheet(req: AuthenticatedRequest, res: Response) {
    try {
      const {faculty} = req.params
      const { level, stage } = req.body;
      const scoreSheet = await ScoreSheetService.getSingleFacultyScoreSheet(faculty, level, stage);
      res.json({ success: true, data: scoreSheet });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to get Faculty score sheet', message: err.message});
    }
  }


   static async getAllFacultyScoreSheets(req: AuthenticatedRequest, res: Response) {
    try {
      const {faculty} = req.params
      const { level, stage } = req.body;
      const scoreSheets = await ScoreSheetService.getAllFacultyScoreSheets(faculty, level, stage);
      res.json({ success: true, data: scoreSheets });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to get Faculty score sheet history', message: err.message});
    }
  }
  
  static async UpdateCriterionFacultyScoreSheet(req: AuthenticatedRequest, res: Response) {
    try {
      const { criteria } = req.body;
      const { criterionId } = req.params;
      const userId = req.user?.id || ''
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`

      const lecturer = await LecturerService.getLecturerById(userId)
      const faculty = lecturer?.faculty || 'N/A'
      
      const scoreSheet = await ScoreSheetService.UpdateCriterionFacultyScoreSheet(userId, criterionId, criteria);
      await ActivityLogService.logActivity(userId, userName, role, 'Updated a Faculty ', 'ScoreSheet Criterion', faculty, school);
      res.json({ success: true, data: scoreSheet });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to update department score sheet', message: err.message});
    }
  }


    /** Create a general template score sheet */
  static async createGeneralScoreSheet(req: AuthenticatedRequest, res: Response) {
    try {
      const { criteria } = req.body;
     
      const userId = req.user?.id || ''
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`
      
      const scoreSheet = await ScoreSheetService.createGeneralScoreSheet(criteria);
      await ActivityLogService.logActivity(userId, userName, role, 'Created a General ', 'ScoreSheet', 'For', school);
      res.json({ success: true, data: scoreSheet });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false,error: 'Failed to create general score sheet',message: err.message});
    }
  }

    static async updateGenCriterion(req: AuthenticatedRequest, res: Response) {
    try {
      const { criteria } = req.body
      const { criterionId } = req.params;
      const userId = req.user?.id || ''
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`

      
      const scoreSheet = await ScoreSheetService.updateGenCriterion(criterionId, criteria);
      await ActivityLogService.logActivity(userId, userName, role, 'Updated a General ', 'Criterion', 'For', school);
    
      res.json({ success: true, data: scoreSheet });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to update general score sheet', message: err.message});
    }
  }

static async getGenScoreSheet(req: AuthenticatedRequest, res: Response) {
    try {

      const scoreSheet = await ScoreSheetService.getGenScoreSheet();
      res.json({ success: true, data: scoreSheet });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to get general score sheet', message: err.message});
    }
  }

  static async deleteCriterionDeptScoreSheet(req: AuthenticatedRequest, res: Response) {
    try {
      const { criterionId } = req.params;
      const userId = req.user?.id || ''
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`

      const lecturer = await LecturerService.getLecturerById(userId)
      const faculty = lecturer?.faculty || 'N/A'
      
      const deletedId = await ScoreSheetService.deleteCriterionFacultyScoreSheet(userId, criterionId);
      await ActivityLogService.logActivity(userId, userName, role, 'Deleted a Department ', 'ScoreSheet Criterion', faculty, school);
      
      res.json({ success: true, data: deletedId });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to delete criterion', message: err.message});
    }
  }

  static async deleteGenCriterion(req: AuthenticatedRequest, res: Response) {
    try {
      const { criterionId } = req.params;
      const userId = req.user?.id || ''
      const role = req.user?.role[0] || ''
      const school = req.user?.school || ''
      const user = await UserService.getUserProfile(userId)
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`
          
    

      await ActivityLogService.logActivity(userId, userName, role, 'Deleted a General ', 'Criterion', 'For', school);
      const deletedId = await ScoreSheetService.deleteGenCriterion(criterionId);
      res.json({ success: true, data: deletedId });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({success: false, error: 'Failed to delete criterion', message: err.message});
    }
  }
}
import { Request, Response } from 'express';
import AnalyticsService from '../services/analytics';

export default class AnalyticsController {
  static async getAdminAnalytics(req: Request, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const stats = await AnalyticsService.getDashboardStats(year);
      
      res.json({success: true, data: stats});
    } catch (err: any) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch analytics", 
        error: err.message 
      });
    }
  }
}
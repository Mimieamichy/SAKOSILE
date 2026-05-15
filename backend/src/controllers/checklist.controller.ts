// controllers/checklist.controller.ts
import { Request, Response } from 'express';
import ChecklistService from '../services/checklist';
import ActivityLogService from '../services/activity_log';
import UserService from '../services/user';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string[];
    permissions: string[];
    [key: string]: any;
  };
}


export default class ChecklistController {

  // ── TEMPLATE MANAGEMENT ────────────────────────────────────────────────────

  static async createTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { level, stage, items } = req.body;
      const userId    = req.user?.id     || '';
      const role      = req.user?.role[0] || '';
      const school    = req.user?.school || '';

      const user     = await UserService.getUserProfile(userId);
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`.trim();

      const template = await ChecklistService.createTemplate({ school, level, stage, items, createdBy: userId });

      await ActivityLogService.logActivity(userId, userName, role, 'created', `checklist template for ${level} – ${stage}`,'', school);

      res.status(201).json({ success: true, data: template });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to create template', message: err.message });
    }
  }

  static async updateTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { templateId } = req.params;
      const {items} = req.body;
      const userId    = req.user?.id     || '';
      const role      = req.user?.role[0] || '';
      const school    = req.user?.school || '';

      const user     = await UserService.getUserProfile(userId);
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`.trim();

      const template = await ChecklistService.updateTemplate(templateId, items);

      await ActivityLogService.logActivity(userId, userName, role,'updated',`checklist template (${template.level} – ${template.stage})`,'', school);

      res.status(200).json({ success: true, data: template });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to update template', message: err.message });
    }
  }

  static async deleteTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { templateId } = req.params;
      const userId    = req.user?.id     || '';
      const role      = req.user?.role[0] || '';
      const school    = req.user?.school || '';

      const user     = await UserService.getUserProfile(userId);
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`.trim();

      const result = await ChecklistService.deleteTemplate(templateId);

      await ActivityLogService.logActivity(
        userId, userName, role,
        'deleted',
        `checklist template (id: ${templateId})`,
        '', school
      );

      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to delete template', message: err.message });
    }
  }

  static async getTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { level, stage } = req.params;
      const school = req.user?.school || '';
      const template = await ChecklistService.getTemplate(school, level, stage);
      res.status(200).json({ success: true, data: template });
    } catch (err: any) {
      console.log(err);
      res.status(404).json({ success: false, error: 'Template not found', message: err.message });
    }
  }

  static async getAllTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const school = req.user?.school || '';
      const { level } = req.query;
      const templates = await ChecklistService.getAllTemplates(school, level as string | undefined);
      res.status(200).json({ success: true, data: templates });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to fetch templates', message: err.message });
    }
  }

  // ── STUDENT CHECKLIST INSTANCES ────────────────────────────────────────────

  static async createStudentChecklist(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId, stage, level } = req.body;
      const userId    = req.user?.id     || '';
      const role      = req.user?.role[0] || '';
      const school    = req.user?.school || '';

      const user     = await UserService.getUserProfile(userId);
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`.trim();

      const checklist = await ChecklistService.createStudentChecklist(studentId, stage, level);

      await ActivityLogService.logActivity(
        userId, userName, role,
        'assigned',
        `checklist for stage "${stage}" to student (id: ${studentId})`,
        '', school
      );

      res.status(201).json({ success: true, data: checklist });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to create student checklist', message: err.message });
    }
  }

  static async getStudentChecklist(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId, stage } = req.params;
      const checklist = await ChecklistService.getStudentChecklist(studentId, stage);
      res.status(200).json({ success: true, data: checklist });
    } catch (err: any) {
      console.log(err);
      res.status(404).json({ success: false, error: 'Checklist not found', message: err.message });
    }
  }

  static async getAllStudentChecklists(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const checklists = await ChecklistService.getAllChecklistsForStudent(studentId);
      res.status(200).json({ success: true, data: checklists });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to fetch student checklists', message: err.message });
    }
  }

  static async tickItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { checklistId } = req.params;
      const { templateItemId, ticked } = req.body;
      const userId    = req.user?.id     || '';
      const role      = req.user?.role[0] || '';
      const school    = req.user?.school || '';

      const user     = await UserService.getUserProfile(userId);
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`.trim();

      const checklist = await ChecklistService.tickItem(checklistId, templateItemId, userId, ticked);

      const tickedEntry = checklist.entries.find(
        (e) => e.templateItemId.toString() === templateItemId
      );
      const action = ticked ? 'ticked' : 'un-ticked';

      await ActivityLogService.logActivity(
        userId, userName, role,
        action,
        `checklist item "${tickedEntry?.label ?? templateItemId}" on checklist (id: ${checklistId})`,
        '', school
      );

      res.status(200).json({ success: true, data: checklist });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to update checklist item', message: err.message });
    }
  }

  static async approveForNextStage(req: AuthenticatedRequest, res: Response) {
    try {
      const { checklistId } = req.params;
      const userId    = req.user?.id     || '';
      const role      = req.user?.role[0] || '';
      const school    = req.user?.school || '';

      const user     = await UserService.getUserProfile(userId);
      const userName = `${user.user.title || ''} ${user.user.firstName || ''} ${user.user.lastName || ''}`.trim();

      const result = await ChecklistService.approveForNextStage(checklistId, userId);
      const { checklist } = result;

      await ActivityLogService.logActivity(userId, userName, role,'approved',`student checklist (id: ${checklistId}) for next stage – "${checklist.stage}"`,'', school);

      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to approve checklist', message: err.message });
    }
  }
}
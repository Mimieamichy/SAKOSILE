import { Request, Response } from 'express';
import ChecklistService from '../services/checklist';
import ReadinessFormService from '../services/readinessForm';
import ChecklistController from './checklist.controller';
import ReadinessFormController from './readinessForm.controller';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string[];
    permissions: string[];
    school?: string;
    [key: string]: any;
  };
}

export default class TemplateController {
  static async createOrUpdateTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { level, stage, items, form } = req.body;
      const userId = req.user?.id || '';
      const school = req.user?.school || '';

      if (items) {
        // Handle Checklist Template
        const template = await ChecklistService.createOrUpdateTemplate({
          school,
          level,
          stage,
          items,
          createdBy: userId
        });
        return res.status(201).json({ success: true, data: template });
      } else if (form) {
        // Handle Readiness Form Template
        const template = await ReadinessFormService.createOrUpdateTemplate({
          school,
          level,
          stage,
          form,
          createdBy: userId
        });
        return res.status(201).json({ success: true, data: template });
      } else {
        return res.status(400).json({ success: false, error: 'Either items (checklist) or form (readiness) must be provided' });
      }
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async updateTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { templateId } = req.params;
      const { items, form } = req.body;

      if (items) {
        const template = await ChecklistService.updateTemplate(templateId, items);
        return res.status(200).json({ success: true, data: template });
      } else if (form) {
        const template = await ReadinessFormService.updateTemplate(templateId, form);
        return res.status(200).json({ success: true, data: template });
      } else {
        return res.status(400).json({ success: false, error: 'Either items or form must be provided' });
      }
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async deleteTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { templateId } = req.params;
      // We need to know which service to call. We can try both or check the model type if we had one.
      // For now, let's try to find it in both collections.
      try {
        await ChecklistService.deleteTemplate(templateId);
        return res.status(200).json({ success: true, message: 'Checklist template deleted' });
      } catch (err) {
        await ReadinessFormService.deleteTemplate(templateId);
        return res.status(200).json({ success: true, message: 'Readiness template deleted' });
      }
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getAllTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const school = req.user?.school || '';
      const { level, type } = req.query;

      let checklists = [];
      let readinessForms = [];

      if (!type || type === 'checklist') {
        checklists = await ChecklistService.getAllTemplates(school, level as string);
      }
      if (!type || type === 'readiness') {
        readinessForms = await ReadinessFormService.getAllTemplates(school, level as string);
      }

      res.status(200).json({ 
        success: true, 
        data: {
          checklists,
          readinessForms,
          // For compatibility with some frontend calls that expect a flat array
          all: [...checklists, ...readinessForms]
        }
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getStudentDocumentation(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId, stage: paramStage } = req.params;
      const { stage: queryStage } = req.query;

      const student = await ChecklistService.getStudentById(studentId);
      if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

      const currentStage = (paramStage as string) || (queryStage as string) || student.currentStage;

      // Try to get current stage documentation
      const checklist = await ChecklistService.getStudentChecklist(studentId, currentStage).catch(() => null);
      const readinessForm = await ReadinessFormService.getStudentReadinessForm(studentId, currentStage).catch(() => null);

      // Also get all for overview if needed
      const allChecklists = await ChecklistService.getAllChecklistsForStudent(studentId).catch(() => []);
      const allReadinessForms = await ReadinessFormService.getAllReadinessFormsForStudent(studentId).catch(() => []);

      res.status(200).json({ 
        success: true, 
        data: { 
          checklist, 
          readinessForm,
          allChecklists,
          allReadinessForms,
          currentStage
        } 
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async tickChecklist(req: AuthenticatedRequest, res: Response) {
    return ChecklistController.tickItem(req, res);
  }

  static async approveChecklist(req: AuthenticatedRequest, res: Response) {
    return ChecklistController.approveForNextStage(req, res);
  }
}

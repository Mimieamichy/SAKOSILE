// filepath: backend/src/controllers/readinessForm.controller.ts
import { Request, Response } from 'express';
import ReadinessFormService from '../services/readinessForm';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string[];
    permissions: string[];
    [key: string]: any;
  };
}


export default class ReadinessFormController {

  // ── TEMPLATE ───────────────────────────────────────────────────────────────

  static async createTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { school, level, stage, form } = req.body;
      const createdBy = req.user?.id || '';

      const template = await ReadinessFormService.createTemplate({ school, level, stage, form, createdBy });
      res.status(201).json({ success: true, data: template });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const { form } = req.body;

      const template = await ReadinessFormService.updateTemplate(templateId, form);
      res.status(200).json({ success: true, data: template });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;

      const result = await ReadinessFormService.deleteTemplate(templateId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { school, level, stage } = req.query;

      const template = await ReadinessFormService.getTemplate(
        school as string,
        level as string,
        stage as string
      );
      res.status(200).json({ success: true, data: template });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getAllTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { school, level } = req.query;

      const templates = await ReadinessFormService.getAllTemplates(
        school as string,
        level as string | undefined
      );
      res.status(200).json({ success: true, data: templates });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ── STUDENT FORM INSTANCE ──────────────────────────────────────────────────

  static async assignReadinessForm(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, stage, level } = req.body;

      if (!studentId || !stage || !level) {
        res.status(400).json({ success: false, error: 'studentId, stage and level are required' });
        return;
      }

      const form = await ReadinessFormService.assignReadinessForm(studentId, stage, level);
      res.status(201).json({ success: true, data: form });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getStudentReadinessForm(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { stage } = req.query;

      const form = await ReadinessFormService.getStudentReadinessForm(
        studentId,
        stage as string
      );
      res.status(200).json({ success: true, data: form });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getAllReadinessFormsForStudent(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;

      const forms = await ReadinessFormService.getAllReadinessFormsForStudent(studentId);
      res.status(200).json({ success: true, data: forms });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async deleteStudentReadinessForm(req: Request, res: Response): Promise<void> {
    try {
      const { formId } = req.params;

      const result = await ReadinessFormService.deleteStudentReadinessForm(formId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
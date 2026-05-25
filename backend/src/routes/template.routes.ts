import { Router } from 'express';
import TemplateController from '../controllers/template.controller';
import { authenticate } from '../middlewares/auth';
import { checkPermission } from '../middlewares/permission';
import { Permission } from '../utils/permissions';

const router = Router();

// ── Unified Template management ──────────────────────────────────────────────
router.post('/template', authenticate, checkPermission(Permission.MANAGE_TEMPLATES), TemplateController.createOrUpdateTemplate);
router.put('/template/:templateId', authenticate, checkPermission(Permission.MANAGE_TEMPLATES), TemplateController.updateTemplate);
router.delete('/template/:templateId', authenticate, checkPermission(Permission.MANAGE_TEMPLATES), TemplateController.deleteTemplate);
router.get('/templates', authenticate, TemplateController.getAllTemplates);

// ── Unified Student Documentation ───────────────────────────────────────────
// These match the frontend calls: /api/student/:studentId
router.get('/student/:studentId', authenticate, TemplateController.getStudentDocumentation);
router.get('/student/:studentId/:stage', authenticate, TemplateController.getStudentDocumentation);

// ── Checklist Actions (Unified) ─────────────────────────────────────────────
// These match the frontend calls: /api/:checklistId/tick
router.patch('/:checklistId/tick', authenticate, checkPermission(Permission.MANAGE_CHECKLISTS), TemplateController.tickChecklist);
router.patch('/:checklistId/approve', authenticate, checkPermission(Permission.MANAGE_CHECKLISTS), TemplateController.approveChecklist);

export default router;

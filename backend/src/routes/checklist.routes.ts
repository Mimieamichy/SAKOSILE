// routes/checklist.routes.ts
import { Router } from 'express';
import ChecklistController from '../controllers/checklist.controller';
import { authenticate } from '../middlewares/auth';
import { checkPermission } from '../middlewares/permission';
import { Permission } from '../utils/permissions';

const router = Router();

// ── Template management (DEPRECATED - Moved to unified /api/template) ───────
// router.post('/template', authenticate, checkPermission(Permission.MANAGE_CHECKLISTS), ChecklistController.createTemplate);
// router.put('/template/:templateId', authenticate, checkPermission(Permission.MANAGE_CHECKLISTS), ChecklistController.updateTemplate);
// router.delete('/template/:templateId', authenticate, checkPermission(Permission.MANAGE_CHECKLISTS), ChecklistController.deleteTemplate);
// router.get('/templates', authenticate, ChecklistController.getAllTemplates);          // ?level=msc|phd
// router.get('/template/:level/:stage', authenticate, ChecklistController.getTemplate);

// ── Student checklist instances ───────────────────────────────────────────────
// (DEPRECATED - Moved to unified /api/...)
// router.get('/student/:studentId', authenticate, ChecklistController.getAllStudentChecklists);
// router.get('/student/:studentId/:stage', authenticate, ChecklistController.getStudentChecklist);
// router.patch('/:checklistId/tick', authenticate, checkPermission(Permission.MANAGE_CHECKLISTS), ChecklistController.tickItem);
// router.patch('/:checklistId/approve', authenticate, checkPermission(Permission.MANAGE_CHECKLISTS), ChecklistController.approveForNextStage);

// (Remaining active routes if any, e.g. for creating a manual checklist instance)
router.post('/student', authenticate, checkPermission(Permission.MANAGE_CHECKLISTS), ChecklistController.createStudentChecklist);

export default router;
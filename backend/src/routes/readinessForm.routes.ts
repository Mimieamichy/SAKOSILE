// filepath: backend/src/routes/readinessForm.routes.ts
import { Router } from 'express';
import ReadinessFormController from '../controllers/readinessForm.controller';
import { authenticate } from '../middlewares/auth';
import { checkPermission } from '../middlewares/permission';
import { Permission } from '../utils/permissions';

const router = Router();

// All routes require authentication
router.use(authenticate);

// template routes (DEPRECATED - Moved to unified /api/template)
// router.post('/template', authenticate, checkPermission(Permission.MANAGE_TEMPLATES), ReadinessFormController.createTemplate);
// router.put('/template/:templateId', authenticate, checkPermission(Permission.MANAGE_TEMPLATES), ReadinessFormController.updateTemplate);
// router.delete('/template/:templateId', authenticate, checkPermission(Permission.MANAGE_TEMPLATES), ReadinessFormController.deleteTemplate);
// router.get('/template', authenticate, ReadinessFormController.getTemplate);
// router.get('/templates', authenticate, ReadinessFormController.getAllTemplates);

// student form routes
// (DEPRECATED - Moved to unified /api/student/:studentId)
// router.get('/student/:studentId', authenticate, ReadinessFormController.getStudentReadinessForm);
// router.get('/student/:studentId/all', authenticate, ReadinessFormController.getAllReadinessFormsForStudent);
router.post('/student', authenticate, checkPermission(Permission.MANAGE_TEMPLATES), ReadinessFormController.assignReadinessForm);

router.delete('/:formId', authenticate, checkPermission(Permission.MANAGE_STUDENTS), ReadinessFormController.deleteStudentReadinessForm);


export default router;
import { Router } from 'express';
import SchoolController from '../controllers/school.controller';
import { authenticate } from '../middlewares/auth';
import { checkPermission } from '../middlewares/permission';
import { Permission } from '../utils/permissions';

const router = Router();

router.use(authenticate, checkPermission(Permission.ADD_SCHOOL));

// School Management
router.post('/', SchoolController.addSchool);
router.patch('/:id/status',  SchoolController.toggleSchoolStatus);
router.get('/', SchoolController.getAllSchols);



export default router;
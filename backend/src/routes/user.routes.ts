import { Router } from 'express';
import UserController from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';
import { checkPermission } from '../middlewares/permission';
import { Permission } from '../utils/permissions';


const router = Router();

router.use(authenticate);

router.get('/profile',  UserController.getUserProfile);
router.put('/update-password',  UserController.updatePassword);
router.get('/activity-logs',  checkPermission(Permission.VIEW_ACTIVITY_LOGS), UserController.getAllLogs)


router.use(checkPermission(Permission.ADD_SCHOOL));
router.get('/users-report', UserController.getUsersAndStats);
router.patch('/:id/status', UserController.toggleUserStatus);

export default router;
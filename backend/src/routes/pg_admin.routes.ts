import { Router } from 'express';
import PGAdminController from '../controllers/pg_admin.controller';
import { authenticate } from '../middlewares/auth';
import { checkPermission } from '../middlewares/permission';
import { Permission } from '../utils/permissions';



const router = Router();


router.post('/admin',  authenticate, checkPermission(Permission.ADD_PG_ADMIN), PGAdminController.createAdmin
);


export default router;
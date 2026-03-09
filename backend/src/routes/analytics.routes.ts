// src/routes/faculty.ts
import { Router } from 'express';
import AnalyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth';


const router = Router();

// Get all faculties
router.get('/', authenticate, AnalyticsController.getAdminAnalytics);


export default router;

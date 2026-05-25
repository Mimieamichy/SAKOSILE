// src/routes/faculty.ts
import { Router } from 'express';
import FacultyController from '../controllers/faculty.controller';
import { authenticate } from '../middlewares/auth';


const router = Router();

// Get all faculties
router.get('/', authenticate, FacultyController.getAllDepartmentsForFaculty);

// Get faculty by ID
router.get('/:facultyId', authenticate, FacultyController.getFacultyById);

export default router;

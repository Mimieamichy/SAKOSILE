// src/routes/faculty.ts
import { Router } from 'express';
import InstitutionController from '../controllers/institution.controller';


const router = Router();

// Get all faculties
router.get('/', InstitutionController.getAllInstitutions);



export default router;

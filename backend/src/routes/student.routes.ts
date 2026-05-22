// src/routes/auth.ts
import { Router } from 'express';
import StudentController from '../controllers/student.controller';
import { validateBody } from '../middlewares/validations';
import { authenticate } from '../middlewares/auth';
import { checkPermission } from '../middlewares/permission';
import { Permission } from '../utils/permissions';
import Joi from 'joi';

const router = Router();

// Schemas\```json
export const addStudentSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().required(), 
  lastName: Joi.string().required(), 
  matNo: Joi.string().required(),
  degree: Joi.string().valid('msc', 'phd').required(), 
  projectTopic: Joi.string().required(),
  session: Joi.string().required(),
});


export const addSupervisorSchema = Joi.object({
  staffId: Joi.string().required(),
  staffName: Joi.string().required(),
  type: Joi.string().valid('major', 'minor', 'internal_examiner').required(), 
  matNo: Joi.string().required(),
})

// Routes
router.post('/add', validateBody(addStudentSchema), authenticate, checkPermission(Permission.ADD_STUDENTS),StudentController.addStudent)
router.get('', authenticate, StudentController.getOneStudentByUser);
router.get('/:studentId', StudentController.getOneStudent);
router.put('/:studentId', authenticate, StudentController.editStudent);
router.delete('/:studentId', authenticate, checkPermission(Permission.DELETE_STUDENT), StudentController.deleteStudent);
router.get('/:level/:department/:session', authenticate, checkPermission(Permission.VIEW_ALL_STUDENTS),StudentController.getStudents);
router.post('/assignSupervisor/:studentId', validateBody(addSupervisorSchema), authenticate, checkPermission(Permission.ASSIGN_SUPERVISORS), StudentController.assignSupervisor);
router.get('/getMyStudents/msc', authenticate, checkPermission(Permission.VIEW_PROJECT_BY_STUDENT), StudentController.getStudentsBySupervisorMsc)
router.get('/getMyStudents/phd', authenticate, checkPermission(Permission.VIEW_PROJECT_BY_STUDENT), StudentController.getStudentsBySupervisorPhd);
router.post('/assign-college-rep/:staffId/:studentId', authenticate, checkPermission(Permission.ASSIGN_COLLEGE_REP), StudentController.assignCollegeRep);






export default router;

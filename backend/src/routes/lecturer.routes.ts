import { Router } from 'express';
import LecturerController from '../controllers/lecturer.controller';
import { authenticate } from '../middlewares/auth';
import { checkPermission } from '../middlewares/permission';
import { validateBody } from '../middlewares/validations';
import { Permission } from '../utils/permissions';
import Joi from 'joi';



const router = Router();

// ✅ Validation Schema for HOD creation
const addHodSchema = Joi.object({
  email: Joi.string().email().required(),
  title: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().required(),
  staffId: Joi.string().required(),
  faculty: Joi.string().required(),
  department: Joi.string().required(),
}); 


const addDeanSchema = Joi.object({
  email: Joi.string().email().required(),
  title: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().required(),
  staffId: Joi.string().required(),
  faculty: Joi.string().required(),
  department: Joi.string().required(),
}); 

const addLectuerSchema = Joi.object({
  email: Joi.string().email().required(),
  title: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().required(),
  staffId: Joi.string().required(),
});

// ✅ Routes with authentication and permissions
router.get('/', authenticate, checkPermission(Permission.VIEW_ALL_LECTURERS), LecturerController.getAllLecturers);
router.put('/:lecturerId', authenticate, checkPermission(Permission.EDIT_LECTURER), LecturerController.editLecturer);
router.delete('/:lecturerId', authenticate, checkPermission(Permission.DELETE_LECTURER), LecturerController.deleteLecturer);
router.post('/add-lecturer', authenticate, checkPermission(Permission.ADD_LECTURER), validateBody(addLectuerSchema), LecturerController.addLecturer);
router.get('/get-hods', authenticate, checkPermission(Permission.GET_HODS), LecturerController.getHODs);
router.get('/get-dean', authenticate, checkPermission(Permission.GET_DEAN), LecturerController.getDeans);
router.get('/get-faculty-rep', authenticate, checkPermission(Permission.VIEW_FACULTY_REP), LecturerController.getFacultyReps);
router.get('/get-college-rep', LecturerController.getCollegeReps);
router.get('/get-provost', authenticate, checkPermission(Permission.GET_PROVOST), LecturerController.getProvost);
router.post('/add-hod', authenticate, checkPermission(Permission.ADD_HOD), validateBody(addHodSchema), LecturerController.addHOD);
router.post('/add-external-examiner', authenticate, checkPermission(Permission.ADD_EXTERNAL_EXAMINER), LecturerController.addExternalExaminer);
router.get('/get-external-examiner', authenticate, LecturerController.getExternlExaminer);
router.post('/add-dean', authenticate, checkPermission(Permission.ADD_DEAN), validateBody(addDeanSchema), LecturerController.addDean);
router.post('/add-provost', authenticate, checkPermission(Permission.ADD_PROVOST), validateBody(addLectuerSchema), LecturerController.addProvost);
router.get('/department', authenticate, checkPermission(Permission.VIEW_LECTURERS_BY_DEPARTMENT), LecturerController.getLecturerByDepartment);
router.get('/faculty', authenticate, checkPermission(Permission.VIEW_FACULTY_LECTURERS), LecturerController.getLecturerByFaculty);
router.post('/assign-faculty-rep/:staffId', authenticate, checkPermission(Permission.ASSIGN_FACULTY_REP), LecturerController.assignFacultyRep)

export default router;

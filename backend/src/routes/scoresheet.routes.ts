import { Router } from 'express';
import ScoreSheetController from '../controllers/scoresheet.controller';
import { authenticate } from '../middlewares/auth';
import { checkPermission } from '../middlewares/permission';

import { Permission } from '../utils/permissions';

const router = Router();

router.post('/faculty-score-sheet', authenticate, checkPermission(Permission.GENERATE_FACULTY_SCORE_SHEET), ScoreSheetController.createFacultyScoreSheet);
router.get('/faculty-score-sheet/:faculty', authenticate, checkPermission(Permission.GENERATE_FACULTY_SCORE_SHEET), ScoreSheetController.getAllFacultyScoreSheets);
router.get('/faculty-score-sheet/:faculty/active', authenticate, checkPermission(Permission.GENERATE_FACULTY_SCORE_SHEET), ScoreSheetController.getSingleFacultyScoreSheet);
router.put('/faculty-score-sheet/:criterionId', authenticate, checkPermission(Permission.GENERATE_FACULTY_SCORE_SHEET), ScoreSheetController.UpdateCriterionFacultyScoreSheet);
router.delete('/faculty-score-sheet/:criterionId', authenticate, checkPermission(Permission.GENERATE_FACULTY_SCORE_SHEET), ScoreSheetController.deleteCriterionFacultyScoreSheet);
router.post('/score-sheet', authenticate, checkPermission(Permission.GENERATE_GENERAL_SCORE_SHEET), ScoreSheetController.createGeneralScoreSheet);
router.get('/score-sheet', authenticate, checkPermission(Permission.GENERATE_GENERAL_SCORE_SHEET), ScoreSheetController.getGenScoreSheet);
router.put('/score-sheet/:criterionId', authenticate, checkPermission(Permission.GENERATE_GENERAL_SCORE_SHEET), ScoreSheetController.updateGenCriterion);
router.delete('/score-sheet/:criterionId', authenticate, checkPermission(Permission.GENERATE_GENERAL_SCORE_SHEET), ScoreSheetController.deleteGenCriterion);





export default router;
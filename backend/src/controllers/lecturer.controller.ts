import { Request, Response } from 'express';
import LecturerService from '../services/lecturer'



export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string[];
    permissions: string[];
    [key: string]: any;
  };
}


export default class LecturerController {
  static async getAllLecturers(req: Request, res: Response) {
    try {
      const lecturers = await LecturerService.getAllLecturers();
      res.json({ success: true, data: lecturers });
    } catch (err: any) {
      console.log(err)
      res.status(400).json({ success: false, error: 'invalid_credentials', message: err.message });
    }
  }

  static async deleteLecturer(req: AuthenticatedRequest, res: Response) {
    try {
      const {lecturerId} = req.params;
      await LecturerService.deleteLecturer(lecturerId);
      res.json({ success: true, message: 'Lecturer deleted successfully' })
    } catch (err: any) {
      console.log("Error deleting lecturer:", err);
      res.status(400).json({ success: false, error: 'Failed to delete lecturer', message: err.message });
    }
  }

  static async editLecturer(req: AuthenticatedRequest, res: Response) {
    try {
      const {lecturerId} = req.params;
      const { title, firstName, lastName, staffId } = req.body;
      const updatedLecturer = await LecturerService.editLecturer(lecturerId, {
        staffId,
        firstName,
        lastName,
        title
      });
      res.json({ success: true, data: updatedLecturer })
    } catch (err: any) {
      console.log("Error updating lecturer:", err);
      res.status(400).json({ success: false, error: 'Failed to edit lecturer', message: err.message });
    }
  }

  static async addLecturer(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, title, firstName, lastName, staffId, role } = req.body;
       console.log(req.body)
      const userId = req.user?.id || ''
      const lecturer = await LecturerService.addLecturer({ email, title, firstName, lastName, userId, staffId, role });
      res.json({ success: true, data: lecturer });
    } catch (err: any) {
      console.log('Error adding Lecturer:', err);
      res.status(400).json({ success: false, error: 'Failed to add Lecturer', message: err.message });
    }
  }


  static async addHOD(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, title, firstName, lastName, staffId, role, department, faculty } = req.body;
      const userId = req.user?.id || ''
      const school = req.user?.school || ''
      const hod = await LecturerService.addHOD({ email, title, firstName, lastName, userId, staffId, role, department, faculty , school});
      res.json({ success: true, data: hod });
    } catch (err: any) {
      console.log('Error adding HOD:', err);
      res.status(400).json({ success: false, error: 'Failed to add HOD', message: err.message });
    }
  }

  static async addDean(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, title, firstName, lastName, staffId, role, department, faculty } = req.body;
      const userId = req.user?.id || ''
      const school = req.user?.school || ''
      const dean = await LecturerService.addDean({ email, title, firstName, lastName, userId, staffId, role, department, faculty , school});
      res.json({ success: true, data: dean });
    } catch (err: any) {
      console.log('Error adding Dean:', err);
      res.status(400).json({ success: false, error: 'Failed to add Dean', message: err.message });
    }
  }


  static async addProvost(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, title, firstName, lastName, staffId, role, department, faculty } = req.body;
      const userId = req.user?.id || ''
      const school = req.user?.school || ''
      console.log('WWWW', req.user)
      const provost = await LecturerService.addProvost({ email, title, firstName, lastName, staffId, department, faculty , role, userId, school});
      res.json({ success: true, data: provost });
    } catch (err: any) {
      console.log('Error adding Provost:', err);
      res.status(400).json({ success: false, error: 'Failed to add Provost', message: err.message });
    }
  }


  static async addExternalExaminer(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, title, firstName, lastName, department, role } = req.body;
      const userId = req.user?.id || ''
      const school = req.user?.school || ''
      const external_examiner = await LecturerService.addExternalExaminer({ email, title, firstName, lastName, department, role, userId , school});
      res.json({ success: true, data: external_examiner });
    } catch (err: any) {
      console.log('Error adding external_examiner:', err);
      res.status(400).json({ success: false, error: 'Failed to add external_examiner', message: err.message });
    }
  }

  static async getHODs(req: Request, res: Response) {
    try {
      const hods = await LecturerService.getHODs();
      res.json({ success: true, data: hods });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to get HOD', message: err.message });
    }
  }


  static async getDeans(req: Request, res: Response) {
    try {
      const deans = await LecturerService.getDeans();
      res.json({ success: true, data: deans });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to get Dean', message: err.message });
    }
  }


  static async getFacultyReps(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || ''
      const facultyRep = await LecturerService.getFacultyReps(userId);
      res.json({ success: true, data: facultyRep });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to get Faculty Rep', message: err.message });
    }
  }

  static async getProvost(req: Request, res: Response) {
    try {
      const provost = await LecturerService.getProvost();
      res.json({ success: true, data: provost });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to get Provost', message: err.message });
    }
  }



  static async getExternlExaminer(req: Request, res: Response) {
    try {
       const { department } = req.query;
      const external_examiner = await LecturerService.getExternalExaminer( department as string | undefined);
      res.json({ success: true, data: external_examiner });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to get External Examiner', message: err.message });
    }
  }




  static async getCollegeReps(req: AuthenticatedRequest, res: Response) {
    try {
      const { department = "", level = "", stage = "" } = req.query as {
        department?: string;
        level?: string;
        stage?: string;
      };

      const collegeRep = await LecturerService.getCollegeReps(department, level, stage);
      res.json({ success: true, data: collegeRep });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to get college Reps for students', message: err.message });
    }
  }


  static async getLecturerByDepartment(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '';
      const lecturer = await LecturerService.getLecturerByDepartment(userId);
      res.json({ success: true, data: lecturer });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to get departmental lecturers', message: err.message });
    }
  }


  static async getLecturerByFaculty(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '';
      const provost = await LecturerService.getLecturerByFaculty(userId);
      res.json({ success: true, data: provost });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to get faculty lecturers', message: err.message });
    }
  }


  static async assignFacultyRep(req: AuthenticatedRequest, res: Response) {
    try {
      const { staffId } = req.params
      const faculty_pg_rep = await LecturerService.assignFacultyRep(staffId);
      res.json({ success: true, data: faculty_pg_rep });
    } catch (err: any) {
      console.log(err);
      res.status(400).json({ success: false, error: 'Failed to assign faculty rep', message: err.message });
    }
  }
}


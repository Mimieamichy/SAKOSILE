import { Lecturer, User, Student } from '../models/index';
import { Role } from '../utils/permissions';
import NotificationService from '../services/notification'
import SchoolService from './school';


export default class LecturerService {
    static async getAllLecturers() {
        return Lecturer.find().populate("user");
    }

    static async editLecturer(lecturerId: string, updateData: Partial<{
        staffId: string;
        firstName: string;
        lastName: string;
        title: string;
    }>
    ) {

        console.log(lecturerId)
        // 1. Find the lecturer to get the associated user's ID
        const lecturer = await Lecturer.findById(lecturerId);
        if (!lecturer) {
            throw new Error('Lecturer not found');
        }
        if (!lecturer.user) {
            throw new Error('Associated user ID is missing for this lecturer');
        }

        const { firstName, lastName, title, staffId } = updateData;

        // 2. Separate updates for Lecturer and User models
        const lecturerUpdates: Partial<{ staffId?: string }> = {};
        if (staffId !== undefined) lecturerUpdates.staffId = staffId;

        const userUpdates: Partial<{ firstName?: string; lastName?: string; title?: string }> = {};
        if (firstName !== undefined) userUpdates.firstName = firstName;
        if (lastName !== undefined) userUpdates.lastName = lastName;
        if (title !== undefined) userUpdates.title = title;

        const updatePromises = [];

        // 3. Push promises to the array only if there's data to update
        if (Object.keys(lecturerUpdates).length > 0) {
            updatePromises.push(
                Lecturer.findByIdAndUpdate(lecturerId, lecturerUpdates)
            );
        }

        if (Object.keys(userUpdates).length > 0) {
            updatePromises.push(
                User.findByIdAndUpdate(lecturer.user, userUpdates)
            );
        }

        // 4. Execute all updates in parallel
        await Promise.all(updatePromises);

        // 5. Return the fully updated lecturer document
        const updatedLecturer = await Lecturer.findById(lecturerId).populate('user');
        return updatedLecturer;
    }

    static async deleteLecturer(lecturerId: string) {
        const lecturer = await Lecturer.findById({ _id: lecturerId });
        if (!lecturer) {
            throw new Error("Lecturer not found");
        }

        // Delete the associated user
        await User.findByIdAndDelete(lecturer.user._id);
        await Lecturer.findByIdAndDelete(lecturer._id)

        return lecturer;
    }

    static async addLecturer(data: {
        email: string;
        title: string;
        firstName: string;
        lastName: string;
        userId: string;
        staffId: string;
        role: string;
    }) {

        const normalizedRole = data.role.toLowerCase();

        // Validate and map string to enum
        const roleMap: Record<string, Role> = {
            lecturer: Role.LECTURER,
            pgcord: Role.PGCOORD,

        };

        const resolvedRole = roleMap[normalizedRole];
        if (!resolvedRole) {
            throw new Error(`Invalid role: ${data.role}`);
        }

        const roles: Role[] = [resolvedRole, Role.GENERAL, Role.LECTURER];
        const lecturer = await LecturerService.getLecturerById(data.userId);


        // Get lecturer's department and faculty if no lecturer exists return null
        let faculty = lecturer?.faculty ?? "none";
        let department = lecturer?.department ?? "none";
        let school = lecturer?.school ?? "none";


        // Create User with dynamic roles
        const user = await User.create({
            email: data.email,
            password: data.email,
            roles,
            firstName: data.firstName,
            lastName: data.lastName,
            title: data.title,
        });

        const newLecturer = await Lecturer.create({
            user: user._id,
            department,
            faculty,
            school,
            staffId: data.staffId,
        });
        
        await SchoolService.incrementCount(school, 'staff');
        return newLecturer;
    }

    static async addHOD(data: {
        email: string;
        title: string;
        firstName: string;
        lastName: string;
        userId: string;
        staffId: string;
        role: string;
        department: string;
        faculty: string;
        school: string;
    }) {

        //check if HOD has been added
        const existingHOD = await Lecturer.findOne({
            department: data.department,
        }).populate({
            path: 'user',
            match: { roles: Role.HOD },
        });

        if (existingHOD && existingHOD.user) {
            throw new Error(`A HOD has already been added for the ${data.department} department.`);
        }

        const roles = [Role.HOD, Role.GENERAL, Role.LECTURER];

        const schoolId = await User.findById(data.userId).then(user => user?.schoolId);


        // Create User with dynamic roles
        const user = await User.create({
            email: data.email,
            password: data.email, 
            roles,
            firstName: data.firstName,
            lastName: data.lastName,
            title: data.title,
            schoolId,
        });

        const newLecturer = await Lecturer.create({
            user: user._id,
            department: data.department,
            faculty: data.faculty,
            staffId: data.staffId,
            school: data.school,
        });

        await SchoolService.incrementCount(data.school, 'staff');
        return newLecturer;
    }

    static async addDean(data: {
        email: string;
        title: string;
        firstName: string;
        lastName: string;
        userId: string;
        staffId: string;
        role: string;
        department: string;
        faculty: string;
        school: string;
    }) {

        //check if DEAN has been added
        const existingDean = await Lecturer.findOne({
            faculty: data.faculty,
        }).populate({
            path: 'user',
            match: { roles: Role.DEAN },
        });

        if (existingDean && existingDean.user) {
            throw new Error(`A DEAN has already been added for the ${data.faculty} Faculty.`);
        }

        const roles = [Role.DEAN, Role.GENERAL, Role.LECTURER];

        const schoolId = await User.findById(data.userId).then(user => user?.schoolId);


        // Create User with dynamic roles
        const user = await User.create({
            email: data.email,
            password: data.email,
            roles,
            firstName: data.firstName,
            lastName: data.lastName,
            title: data.title,
            schoolId,
        });

        const newLecturer = await Lecturer.create({
            user: user._id,
            department: data.department,
            school: data.school,
            faculty: data.faculty,
            staffId: data.staffId,
        });

        await SchoolService.incrementCount(data.school, 'staff');
        return newLecturer;
    }

    static async addProvost(data: {
        email: string;
        title: string;
        firstName: string;
        lastName: string;
        staffId: string;
        department: string;
        faculty: string;
        role: string;
        userId: string;
        school: string;
    }) {

        //check if PROVOST has been added
        const existingPROVOST = await Lecturer.findOne({
            faculty: 'none'
        }).populate({
            path: 'user',
            match: { roles: Role.PROVOST },
        });

        if (existingPROVOST && existingPROVOST.user) {
            throw new Error(`A PROVOST has already been added for the school`);
        }

        const roles = [Role.PROVOST, Role.GENERAL, Role.LECTURER];

        const schoolId = await User.findById(data.userId).then(user => user?.schoolId);

        // Create User with dynamic roles
        const user = await User.create({
            email: data.email,
            password: data.email, 
            roles,
            firstName: data.firstName,
            lastName: data.lastName,
            title: data.title,
            schoolId,
        });

        const newLecturer = await Lecturer.create({
            user: user._id,
            department: data.department,
            school: data.school,
            faculty: data.faculty,
            staffId: data.staffId,
        });

        console.log('hooooopp', data.school)
        await SchoolService.incrementCount(data.school, 'staff');
        return newLecturer;
    }

    static async addExternalExaminer(data: {
        email: string;
        title: string;
        firstName: string;
        lastName: string;
        department: string;
        role: string;
        userId: string;
        school: string;
    }) {
        const roles = [Role.EXTERNAL_EXAMINER, Role.GENERAL, Role.PANEL_MEMBER];

        const schoolId = await User.findById(data.userId).then(user => user?.schoolId);

        // Create User with dynamic roles
        const user = await User.create({
            email: data.email,
            password: data.email, // for development; hash in pre-save
            roles,
            firstName: data.firstName,
            lastName: data.lastName,
            title: data.title,
            schoolId,
        });

        const exernal_examiner = await Lecturer.create({
            user: user._id,
            department: data.department,
            school: data.school,
            faculty: 'none',
            staffId: 'none',
        });

        await SchoolService.incrementCount(data.school, 'staff');
        return exernal_examiner;
    }

    static async getHODs() {
        return Lecturer.find()
            .populate({
                path: 'user',
                match: { roles: 'hod' }, // filters users whose roles include 'hod'
            })
            .then(lecturers => lecturers.filter(l => l.user)); // remove lecturers with no matched user
    }

    static async getDeans() {
        return Lecturer.find()
            .populate({
                path: 'user',
                match: { roles: 'dean' }, // filters users whose roles include 'hod'
            })
            .then(lecturers => lecturers.filter(l => l.user)); // remove lecturers with no matched user
    }

    static async getProvost() {
        return Lecturer.find()
            .populate({
                path: 'user',
                match: { roles: 'provost' },
            })
            .then(lecturers => lecturers.filter(l => l.user)); // remove lecturers with no matched user
    }

    static async getExternalExaminer(department?: string) {
        const query: any = {};
        if (department) {
            query.department = department;
        }

        return Lecturer.find(query)
            .populate({
                path: 'user',
                match: { roles: 'external_examiner' },
            })
            .then(lecturers => lecturers.filter(l => l.user)); // keep only those with a matched user
    }


    static async getLecturerByDepartment(userId: string) {
        const currentLecturer = await Lecturer.findOne({ user: userId });
        if (!currentLecturer || !currentLecturer.department) {
            throw new Error("Lecturer not found or department not set");
        }

        return Lecturer.find({ department: currentLecturer.department })
            .populate({
                path: 'user',
                match: { roles: { $ne: 'external_examiner' } } // exclude external examiners
            })
            .then(lecturers =>
                lecturers.filter(l => l.user) // remove ones with null user due to match exclusion
            )
    }


    static async getLecturerByFaculty(userId: string) {
        const currentLecturer = await Lecturer.findOne({ user: userId });
        if (!currentLecturer || !currentLecturer.faculty) {
            throw new Error("Lecturer not found or faculty not set");
        }

        return Lecturer.find({ faculty: currentLecturer.faculty }).populate('user');
    }

    static async getLecturerById(userId: string) {
        const lecturer = await Lecturer.findOne({ user: userId }).populate("user");
        if (!lecturer) {
            throw new Error("Lecturer not found");
        }
        return lecturer;
    }

    static async assignFacultyRep(staffId: string) {
        const lecturer = await Lecturer.findById(staffId).populate('user');
        if (!lecturer) {
            throw new Error('Lecturer not found');
        }

        const oldFacultyRep = await Lecturer.findOne({ faculty: lecturer.faculty }).populate({
            path: 'user',
            match: { roles: Role.FACULTY_PG_REP }
        });

        if (oldFacultyRep && oldFacultyRep.user) {
            await User.findByIdAndUpdate(
                oldFacultyRep.user._id,
                {
                    $pull: { roles: Role.FACULTY_PG_REP }
                }
            );
        }

        // Get current user to preserve existing roles
        const currentUser = await User.findById(lecturer.user._id);
        const currentRoles = currentUser?.roles || [];

        // Remove the roles we're going to add (if they exist)
        const filteredRoles = currentRoles.filter(role =>
            role !== Role.FACULTY_PG_REP && role !== Role.PANEL_MEMBER
        );

        // Create new roles array with specific order
        const newRoles = [Role.FACULTY_PG_REP, Role.PANEL_MEMBER, ...filteredRoles];

        const updatedUser = await User.findByIdAndUpdate(
            lecturer.user._id,
            {
                $set: { roles: newRoles }
            },
            { new: true }
        );

        await NotificationService.createNotifications({
            lecturerIds: [staffId],
            role: "faculty_pg_rep",
            message: `You have been assigned a Faculty PG rep for ${lecturer.faculty}`,
        });

        return updatedUser;
    }

    static async getFacultyReps(userId: string) {
        // Get the lecturer making the request
        const lecturer = await Lecturer.findOne({ user: userId })
        if (!lecturer || !lecturer.faculty) {
            throw new Error("Lecturer not found or department not set");
        }


        const lecturers = await Lecturer.find({ faculty: lecturer.faculty })
            .populate({
                path: "user",
                match: { roles: Role.FACULTY_PG_REP },
                select: "firstName lastName email roles",
            }).lean();

        // Filter out lecturers without a user (failed match)
        const facultyReps = lecturers.filter(l => l.user);

        return facultyReps;

    }

    static async getCollegeReps(department: string, level: string, stage: string) {
        // Get all unique lecturer IDs that are set as collegeRep for matching students
        const repIds = await Student.distinct("collegeRep", {
            department,
            level,
            currentStage: stage,
        });

        if (!repIds.length) return [];

        // Fetch lecturer docs with those IDs
        const collegeReps = await Lecturer.find({ _id: { $in: repIds } })
            .populate("user", "firstName lastName")
            .select("user staffId title department faculty");

        return collegeReps;
    }





}






import { Defence, Student, Project, ScoreSheet, Lecturer, GeneralScoreSheet, User, StudentChecklist, ChecklistTemplate } from '../models/index';
import ChecklistService from './checklist';
import { Types } from 'mongoose';
import NotificationService from "../services/notification";
import { STAGES } from "../utils/constants";
import { IStageScores } from '../models/student';
import { Role } from '../utils/permissions';
import ReadinessFormService from './readinessForm';



export default class DefenceService {

    // Helper method to check if lecturer has any active defences
  static async hasActiveDefences(lecturerId: string | Types.ObjectId) {
    const lecturer = await Lecturer.findById(lecturerId).populate("user");
    if (!lecturer) throw new Error("Lecturer not found");

    const userRoles = (lecturer.user as any)?.roles || [];
  
    const isHodOrProvost =
      Array.isArray(userRoles) &&
      (userRoles.includes("hod") || userRoles.includes("provost"));

    // Base query: all defences the lecturer is part of
    const query: any = { panelMembers: lecturerId };

    // For non-HOD/Provost, only consider ongoing defences
    if (!isHodOrProvost) {
      query.ended = false;
    }

    // Fetch defences with students
    const defences = await Defence.find(query).populate("students");

  if (isHodOrProvost) {
    // Filter defences that still have at least one unmarked student
    const activeDefences = defences.filter((def) => {
      if (!Array.isArray(def.students)) return true;
      const allMarked = def.students.every(
        (student: any) => student.defenceMarked === true
      );
      return !allMarked; // still active if not all marked
    });
    
    return activeDefences.length > 0;
  }

  

    return defences.length > 0;
  }
  /** Get all defences with student details
  */
  static async getAllDefenses() {
    return Defence.find().populate('students');
  }
  /**
   * Schedule a new defence
   * Creates empty score sheet with criteria
   * Notifies panel members with student details & project links
   */
  static async scheduleDefence(options: {
    stage: string;
    program: "MSC" | "PHD";
    session: string;
    date: Date;
    time: string;
    studentIds: (string | Types.ObjectId)[];
    panelMemberIds?: (string | Types.ObjectId)[];
  }) {
    const { stage, session, date, time, studentIds, panelMemberIds = [], program } = options;

    // //0. Set students defenceMarked == false
    // await Student.updateMany(
    // { _id: { $in: studentIds } },
    // { $set: { defenceMarked: false } }
    // );

    // 1. Fetch students and their projects 
     const students = await Student.find({ _id: { $in: studentIds } }).populate('user').lean();

    if (students.length === 0) {
      throw new Error("No students found for the provided IDs.");
    }


    // 2. Collect all associated lecturers IDs from student documents
    const allStudentLecturers: Set<Types.ObjectId | string> = new Set();
    students.forEach((s) => {
      if (s.majorSupervisor) allStudentLecturers.add(s.majorSupervisor.toString());
      if (s.minorSupervisor) allStudentLecturers.add(s.minorSupervisor.toString());
      if (s.internalExaminer) allStudentLecturers.add(s.internalExaminer.toString());
      if (s.collegeRep) allStudentLecturers.add(s.collegeRep.toString());
    });

    // 3. Department and faculty info (assuming all students are from the same one)
    const departmentName = students[0]?.department;
    const studentFaculty = students[0]?.faculty;
    if (!departmentName && !studentFaculty) {
      throw new Error("Department or Faculty not found for students");
    }

    const existingDefence = await Defence.findOne({program: program, stage: stage, department: departmentName, ended: false})
    if (existingDefence) {
      throw new Error("Defence has already been scheduled for this Department, stage and level");
    }
    // 4. Find role-based panel members (HOD, Dean, PGCord)
    const extraPanelMembers: string[] = [];

    const departmentLecturers = await Lecturer.find({ department: departmentName })
      .populate({
        path: "user",
        match: { roles: { $in: [Role.HOD, Role.PGCOORD] } },
        select: "roles",
      });

    if (!departmentLecturers || departmentLecturers.length === 0) {
      throw new Error(`No HOD or PG Coordinator found for department: ${departmentName}`);
    }

    // Loop through and add PANEL_MEMBER role + push IDs
    for (const lecturer of departmentLecturers) {
      if (!lecturer.user) continue; // skip if no linked user

      extraPanelMembers.push((lecturer._id as Types.ObjectId).toString());
    }

    const dean = await Lecturer.findOne({ faculty: studentFaculty }).populate({ path: "user", match: { roles: "dean" }, select: "roles" });
    if (dean) {
      extraPanelMembers.push((dean._id as Types.ObjectId | string).toString());
    } else {
      throw new Error(`DEAN not found for "${studentFaculty}".`);
    }

    // 5. Merge all unique IDs into a single Set
    const allPanelMembers = new Set<string>();

    panelMemberIds.forEach((id) => allPanelMembers.add(id.toString()));
    allStudentLecturers.forEach((id) => allPanelMembers.add(id.toString()));
    extraPanelMembers.forEach((id) => allPanelMembers.add(id));

    const finalPanelMemberIds = Array.from(allPanelMembers);

    // 6. Check if panel member role has been added to panel members else add it 
    if (finalPanelMemberIds.length > 0) {
      // Fetch all lecturers who will be panel members and populate their user data
      const panelLecturers = await Lecturer.find({
        _id: { $in: finalPanelMemberIds }
      }).populate('user');

      // Update users who don't have the PANEL_MEMBER role
      const updatePromises = panelLecturers
        .filter(lecturer =>
          lecturer.user &&
          typeof lecturer.user === 'object' &&
          Array.isArray((lecturer.user as any).roles) &&
          !(lecturer.user as any).roles.includes(Role.PANEL_MEMBER)
        )
        .map(lecturer => {
          (lecturer.user as any).roles.push(Role.PANEL_MEMBER);
          return (lecturer.user as any).save();
        });

      // Wait for all role updates to complete
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(`Added PANEL_MEMBER role to ${updatePromises.length} users`);
      }
    }

    // Create defence
    const defence = await Defence.create({
      stage,
      program,
      session,
      department: departmentName,
      date,
      time,
      students: studentIds,
      panelMembers: finalPanelMemberIds,
      started: false,
      ended: false,
    });

    // Simplified message without student details
    const message = `You have been assigned to be part of the panel members for ${stage} defence scheduled on ${date}, Time: ${time}, Department: ${departmentName}, Program: ${program}`;

    await NotificationService.createNotifications({
      lecturerIds: finalPanelMemberIds,
      role: "panel",
      message,
    });


    return defence; // Return only defence, not details
  }

  /**
   * Marks defence as started
   * Notifies panel members and supervisors
   */
  static async startDefence(defenceId: string) {
    const defence = await Defence.findById(defenceId);
    if (!defence) throw new Error("Defence not found");
    if (defence.started) throw new Error("Defence already started");

    defence.started = true;
    await defence.save();

    const message = `The ${defence.stage} defence has started. You may now score and comment on students' project.`;

    await NotificationService.createNotifications({
      lecturerIds: defence.panelMembers,
      role: "panel members",
      message,
    });


    return defence;
  }

  /**
  * Get a defence
  * Get associated student details (and projects)
  * Ensure the requesting panel member is authorized
  */
  static async getDefenceDetails(defenceId: string, panelMemberId: string) {
    const lecturer = await Lecturer.findOne({ user: panelMemberId });
    if (!lecturer) throw new Error("Lecturer profile not found");
    const lecturerId = (lecturer._id as Types.ObjectId).toString();

    // load defence and populate students.user
    const defence = await Defence.findById(defenceId)
      .populate({
        path: "students",
        populate: { path: "user", select: "firstName lastName email" }
      })
      .lean();

    if (!defence) throw new Error("Defence not found");

    console.log("Defence:", defence)

    // authorization
    const isPanelMember = defence.panelMembers.some((m: any) => {
      // Handle both ObjectId and string types
      const memberId = m instanceof Types.ObjectId ? m.toString() : String(m);
      return memberId === lecturerId;
    });

    if (!isPanelMember) {
      throw new Error("You are not authorized to view this defence");
    }

    // student IDs (canonical order)
    const studentIds = (defence.students || []).map((s: any) => s._id.toString());

    // load projects for students in this defence
    const projects = await Project.find({
      student: { $in: studentIds }
    })
      .populate({
        path: "student",
        populate: { path: "user", select: "firstName lastName email" }
      })
      .lean();

    // map studentId -> project
    const projectMap = new Map<string, any>();
    for (const proj of projects) {
      const sid = proj.student && proj.student._id ? proj.student._id.toString() : String(proj.student);
      projectMap.set(sid, proj);
    }

    // load scoresheet criteria for this defence's department based on the defence
    let criteria: any[] = [];
    if (defence.stage?.toLowerCase() == "external") {
      const generalSheet = await GeneralScoreSheet.findOne().lean();
      if (!generalSheet) throw new Error("General scoresheet not found");
      criteria = generalSheet.criteria || [];
    } else {
      const deptSheet = await ScoreSheet.findOne({ department: defence.department }).lean();
      if (!deptSheet) throw new Error("Departmental scoresheet not found");
      criteria = deptSheet.criteria || [];
    }

    // build students array with only requested fields
    const students = (defence.students || []).map((student: any) => {
      const sid = student._id.toString();
      const project = projectMap.get(sid);
      const latestVersion = project?.versions?.length ? project.versions[project.versions.length - 1] : null;

      // Determine which scores to include based on student level
      const isPhD = student.level === 'phd';

      const studentData = {
        id: sid,
        name: student.user ? `${student.user.firstName} ${student.user.lastName}` : (student.name || ""),
        matNo: student.matricNo || student.matNo || "",
        topic: student.projectTopic || latestVersion?.topic || "",
        fileUrl: latestVersion?.fileUrl || student.latestFile || "",
        currentStage: student.currentStage || "",
        level: student.level,
        defenceMarked: student.defenceMarked,
        stageScores: {}
      };

      // Add relevant stage scores based on program
      if (isPhD) {
        studentData.stageScores = {
          firstSeminarScore: student.stageScores?.firstSeminarScore || 0,
          secondSeminarScore: student.stageScores?.secondSeminarScore || 0,
          thirdSeminarScore: student.stageScores?.thirdSeminarScore || 0,
          externalDefenseScore: student.stageScores?.externalDefenseScore || 0
        };
      } else {
        studentData.stageScores = {
          proposalScore: student.stageScores?.proposalScore || 0,
          internalScore: student.stageScores?.internalScore || 0,
          externalScore: student.stageScores?.externalScore || 0
        };
      }

      return studentData;
    });



    const combinedData = {
      id: defence._id.toString(),
      stage: defence.stage,
      program: defence.program,
      department: defence.department,
      date: defence.date,
      time: defence.time,
      started: defence.started,
      ended: defence.ended,
      students,
      criteria
    };

    return combinedData
  }

  /**
   * Panel member submits score for a student
   */
  static async submitScore(
    defenceId: string,
    panelMemberId: string,
    studentId: string,
    scores: { criterion: string; score: number }[]
  ) {

    const defence = await Defence.findById(defenceId);
    if (!defence) throw new Error("Defence not found");

    if (defence.ended == true) throw new Error("Defence has ended no score can be submitted");
    if (defence.started == false) throw new Error("Defence has not started no score can be submitted");

    // Get the appropriate score sheet
    let scoreSheet: any;
    let sheetModel: any;

    if (defence.stage?.toLowerCase() === "external") {
      sheetModel = GeneralScoreSheet;
      scoreSheet = await GeneralScoreSheet.findOne({});
      if (!scoreSheet) throw new Error("General scoresheet not found");
    } else {
      sheetModel = ScoreSheet;
      scoreSheet = await ScoreSheet.findOne({ department: defence.department });
      if (!scoreSheet) throw new Error("Departmental scoresheet not found");
    }

    if (!Array.isArray(scores) || scores.length === 0) {
      throw new Error("Scores array is required and cannot be empty");
    }

    // Criteria validation
    const definedCriteria = scoreSheet.criteria.map((c: any) => c.name);
    const definedCriteriaSet = new Set(definedCriteria);

    const submittedCriteria = scores.map((s) => s.criterion);
    const submittedSet = new Set(submittedCriteria);

    if (submittedSet.size !== submittedCriteria.length) {
      throw new Error("Duplicate criteria found in submission");
    }

    if (submittedCriteria.length !== definedCriteria.length) {
      throw new Error(
        `You must submit scores for exactly ${definedCriteria.length} criteria`
      );
    }

    for (const crit of submittedCriteria) {
      if (!definedCriteriaSet.has(crit)) {
        throw new Error(`Invalid criterion submitted: ${crit}`);
      }
    }


    // Validate numeric values and ensure each score ≤ its criterion weight
    for (const s of scores) {
      if (typeof s.score !== "number" || Number.isNaN(s.score)) {
        throw new Error(`Score for criterion "${s.criterion}" must be a number`);
      }
      if (s.score < 0) {
        throw new Error(`Score for criterion "${s.criterion}" cannot be negative`);
      }

      const criterionDef = scoreSheet.criteria.find(
        (c: any) => c.name === s.criterion
      );
      if (!criterionDef) {
        throw new Error(`Criterion "${s.criterion}" not found in score sheet`);
      }

      if (s.score > criterionDef.weight) {
        throw new Error(
          `Score for "${s.criterion}" (${s.score}) cannot exceed its weight (${criterionDef.weight})`
        );
      }
    }

    // Check if user already submitted — update or create new
    const existingEntryIndex = scoreSheet.entries.findIndex(
      (e: any) =>
        e.student.toString() === studentId &&
        e.panelMember.toString() === panelMemberId &&
        e.defence.toString() === defenceId
    );

    if (existingEntryIndex >= 0) {
      // Update existing entry
      console.log(scoreSheet.entries[existingEntryIndex])
      scoreSheet.entries[existingEntryIndex].scores = scores;
      await scoreSheet.save();
    } else {
      // Add new entry
      scoreSheet.entries.push({
        student: new Types.ObjectId(studentId),
        panelMember: new Types.ObjectId(panelMemberId),
        defence: new Types.ObjectId(defenceId),
        scores,
      });
      await scoreSheet.save();
    }

    // Return updated sheet as lean (same style as your original version)
    return await sheetModel.findById(scoreSheet._id).lean();
  }

  /** Marks defence as ended
   * Computes average scores and updates Student.stageScores
   * Notifies students that scores are available
   */
  static async endDefence(defenceId: string) {
    const defence = await Defence.findById(defenceId);

    if (!defence) throw new Error("Defence not found");
    if (!defence.started) throw new Error("Defence has not started");
    if (defence.ended) throw new Error("Defence already ended");

    // Find score sheet by department and filter entries by defenceId
    const sheet = await ScoreSheet.findOne({ department: defence.department });
    if (!sheet) throw new Error("ScoreSheet not found for this department");

    const defenceEntries = sheet.entries.filter(
      (entry) => entry.defence.toString() === defenceId
    );
    if (defenceEntries.length === 0) {
      throw new Error("No score entries found for this defence");
    }

    // === Compute total scores per student from all panel members ===
    const studentTotalScores: Record<string, number[]> = {};

    for (const entry of defenceEntries) {
      const totalScore = entry.scores.reduce((sum, s) => sum + s.score, 0);
      const studentId  = entry.student.toString();

      if (!studentTotalScores[studentId]) studentTotalScores[studentId] = [];
      studentTotalScores[studentId].push(totalScore);
    }

    // === Calculate average total score per student ===
    const studentAverages: Record<string, number> = {};

    for (const [studentId, totalScores] of Object.entries(studentTotalScores)) {
      const average = totalScores.reduce((sum, s) => sum + s, 0) / totalScores.length;
      studentAverages[studentId] = Number(average.toFixed(2));
    }

    // === Stage → IStageScores key map ===
    const MSC_STAGE_MAP: Record<string, keyof IStageScores> = {
      [STAGES.MSC.PROPOSAL]: "proposalScore",
      [STAGES.MSC.INTERNAL]: "internalScore",
      [STAGES.MSC.EXTERNAL]: "externalScore",
    };

    const PHD_STAGE_MAP: Record<string, keyof IStageScores> = {
      [STAGES.PHD.PROPOSAL_DEFENSE]:  "proposalDefenceScore",
      [STAGES.PHD.SECOND_SEMINAR]:    "secondSeminarScore",
      [STAGES.PHD.THIRD_SEMINAR]:     "thirdSeminarScore",
      [STAGES.PHD.EXTERNAL_DEFENCE]:  "externalDefenseScore",
    };

    // === Determine the NEXT stage this defence unlocks ===
    // we assign the checklist for the stage they are just finishing — which is defence.stage
    // (the stage they just completed now becomes the stage whose checklist
    //  gates is created 
    const completedStage = defence.stage;
    const level     = defence.program.toLowerCase() as 'msc' | 'phd';

    // === Per-student: save score + assign checklist ===
    for (const studentId of defence.students) {
      const studentIdStr = studentId.toString();
      const averageScore = studentAverages[studentIdStr] || 0;

      const student = await Student.findById(studentId);
      if (!student) continue;

      // Save stage score
      let key: keyof IStageScores;

      if (defence.program === "MSC") {
        key = MSC_STAGE_MAP[defence.stage];
        if (!key) throw new Error(`Unknown MSC defence stage: ${defence.stage}`);
      } else if (defence.program === "PHD") {
        key = PHD_STAGE_MAP[defence.stage];
        if (!key) throw new Error(`Unknown PHD defence stage: ${defence.stage}`);
      } else {
        throw new Error(`Unknown program: ${defence.program}`);
      }

      student.stageScores[key] = averageScore;
      await student.save();

      // === Assign checklist for this stage if a template exists ===
      try {
        const templateExists = await ChecklistTemplate.findOne({
          school: student.school,
          level,
          stage: completedStage,
        });
        if (templateExists) {
          await ChecklistService.createStudentChecklist(studentIdStr, completedStage, level);
          console.log(`Checklist has been assigned to student ${studentIdStr} for stage ${completedStage}`);
        } else {
          console.log(`No checklist template for ${level} – ${completedStage}, skipping assignment`);
        }
      } catch (checklistErr: any) {
        console.error(
          `Failed to assign checklist to student ${studentIdStr} for stage ${completedStage}:`,
          checklistErr.message
        );
      }


      // === Assign readiness form for this stage if a template exists ===
      try {
        await ReadinessFormService.assignReadinessForm(
          studentIdStr,
          completedStage,
          level
        );
        console.log(`Readiness form assigned to student ${studentIdStr} for stage ${completedStage}`);
      } catch (readinessErr: any) {
        // Never block the defence from ending due to a readiness form error
        console.error(
          `Failed to assign readiness form to student ${studentIdStr} for stage ${completedStage}:`,
          readinessErr.message
        );
      }


      // === Notify student ===
      const message = `Your defence for stage ${defence.stage} has ended. Check your Dashboard for panel members' comments.`;
      await NotificationService.createNotifications({
        studentIds: [studentId],
        role: "student",
        message,
      });
    }

    // === Mark defence as ended ===
    defence.ended = true;
    await defence.save();

    // === Remove PANEL_MEMBER role if no other active defences ===
    for (const panelMemberId of defence.panelMembers) {
      const hasActiveDefences = await this.hasActiveDefences(panelMemberId);

      if (!hasActiveDefences) {
        const lecturer = await Lecturer.findById(panelMemberId).populate("user");
        if (lecturer && lecturer.user) {
          (lecturer.user as any).roles = (lecturer.user as any).roles.filter(
            (role: string) => role !== Role.PANEL_MEMBER
          );
          await (lecturer.user as any).save();
          console.log(`Removed PANEL_MEMBER role from lecturer ${panelMemberId}`);
        }
      }
    }

    return defence;
  }


  /**Finds students and move student to next stage in the program type  */
  static async approveStudentDefence(studentId: string) {
    const student = await Student.findById(studentId);
    if (!student) throw new Error("Student not found");

    const defence = await Defence.findOne({ students: studentId, ended: true });
    if (!defence) throw new Error("No ended defence found for this student");

      student.defenceMarked = true
      await student.save();


        const allMarked = await Student.countDocuments({
      _id: { $in: defence.students },
      defenceMarked: false,
    }) === 0;

    if (allMarked) {
      defence.closedForReview = true;
      await defence.save();
      console.log(`Defence ${defence._id} is now closed for review`);
    }

      const message = `Your project has been approved, you can proceed to prepare for next stage.`;

      await NotificationService.createNotifications({
        studentIds: [studentId],
        role: "student",
        message,
      });

      return student;
  }


  /**Rejects a student’s defence and keeps them in the same stage */
  static async rejectStudentDefence(studentId: string) {
    const student = await Student.findById(studentId);
    if (!student) throw new Error("Student not found");

    const defence = await Defence.findOne({ students: studentId, ended: true });
    if (!defence) throw new Error("No ended defence found for this student");

    // set score for the current stage = 0
    if (student.level === "msc") {
      switch (defence.stage) {
        case STAGES.MSC.PROPOSAL:
          student.stageScores.proposalScore = 0;
          break;
        case STAGES.MSC.INTERNAL:
          student.stageScores.internalScore = 0;
          break;
        case STAGES.MSC.EXTERNAL:
          student.stageScores.externalScore = 0;
          break;
        default:
          throw new Error(`Invalid MSc stage: ${defence.stage}`);
      }
    } else if (student.level === "phd") {
      switch (defence.stage) {
        case STAGES.PHD.PROPOSAL_DEFENSE:
          student.stageScores.proposalDefenceScore = 0;
          break;
        case STAGES.PHD.SECOND_SEMINAR:
          student.stageScores.secondSeminarScore = 0;
          break;
        case STAGES.PHD.THIRD_SEMINAR:
          student.stageScores.thirdSeminarScore = 0;
          break;
        case STAGES.PHD.EXTERNAL_DEFENCE:
          student.stageScores.externalDefenseScore = 0;
          break;
        default:
          throw new Error(`Invalid PhD stage: ${defence.stage}`);
      }
    }

    student.defenceMarked = true
    await student.save();

    const allMarked = await Student.countDocuments({
       _id: { $in: defence.students },
        defenceMarked: false,
    }) === 0;

if (allMarked) {
  defence.closedForReview = true;
  await defence.save();
  console.log(`Defence ${defence._id} is now closed for review`);
}
    

    // notify student
    const message = `Your project was not approved, you need to rejoin defence for ${student.currentStage}.`;

    await NotificationService.createNotifications({
      studentIds: [studentId],
      role: "student",
      message,
    });

    return { student, defence };
  }



  /**Get all the active defences for a panel member */
static async getDefenceForPanelMember(program: string, userId: string) {
  const lecturer = await Lecturer.findOne({ user: userId }).populate("user");
  if (!lecturer) throw new Error("Lecturer profile not found");

  const lecturerId = lecturer._id;

  const isHodOrProvost =
    lecturer.user &&
    Array.isArray((lecturer.user as any).roles) &&
    ((lecturer.user as any).roles.includes("hod") ||
      (lecturer.user as any).roles.includes("provost"));

  const baseQuery: any = {
    program,
    panelMembers: lecturerId,
    closedForReview: { $ne: true }, // exclude closed defences
  };

  if (!isHodOrProvost) {
    // Regular panel members only see ongoing defences
    baseQuery.ended = false;
  }

  const defences = await Defence.find(baseQuery)
    .select("_id stage program department date time started ended students closedForReview")
    .populate("students", "name matricNo defenceMarked")
    .lean();

  if (!defences.length) {
    throw new Error(`No ${program} defences found where you are a panel member`);
  }

  if (isHodOrProvost) {
    const visibleDefences = defences.filter((def) => {
      if (!Array.isArray(def.students) || def.students.length === 0) return false;

      const allMarked = def.students.every((s: any) => s.defenceMarked === true);

      // Show if not ended OR ended but not all students marked
      return def.ended === false || !allMarked;
    });

    return visibleDefences;
  }
  console.log(defences)

  return defences;
}




  /**Get other lecturers in the department that is not a panel member for a defence */
  static async getAvailableLecturersForDefence(
  options: { 
    stage: string; 
    level: string; 
    department: string; 
  }
) {
  const { stage, level, department } = options;

  // 1. Get students matching stage, level, and department
  const students = await Student.find({
    currentStage: stage,
    level,
    department
  }).lean();

  if (students.length === 0) {
    throw new Error("No students found for the specified stage, level, or department.");
  }

  // 2. Collect all associated lecturers (supervisors, internal examiners, college reps)
  const assignedLecturerIds = new Set<string>();
  students.forEach((s) => {
    if (s.majorSupervisor) assignedLecturerIds.add(s.majorSupervisor.toString());
    if (s.minorSupervisor) assignedLecturerIds.add(s.minorSupervisor.toString());
    if (s.internalExaminer) assignedLecturerIds.add(s.internalExaminer.toString());
    if (s.collegeRep) assignedLecturerIds.add(s.collegeRep.toString());
  });

  // 3. Get all lecturers in that department
  const allLecturers = await Lecturer.find({ department })
    .populate('user', 'firstName lastName roles email');

  // 4. Exclude assigned supervisors and examiners
  const availableLecturers = allLecturers.filter(
    (lecturer: any) => !assignedLecturerIds.has(String(lecturer._id))
  );

  // 5. Exclude external examiners or restricted roles
  const filteredLecturers = availableLecturers.filter(
    (lecturer) =>
      lecturer.user &&
      typeof lecturer.user === 'object' &&
      Array.isArray((lecturer.user as any).roles) &&
      !(lecturer.user as any).roles.includes('external_examiner')
  );

  return filteredLecturers;
}



 






}

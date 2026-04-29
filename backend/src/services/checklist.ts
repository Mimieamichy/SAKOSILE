// services/checklist.service.ts
import { Types } from 'mongoose';
import { ChecklistTemplate, StudentChecklist, Student, IStudentChecklist } from '../models/index';
import { STAGES } from '../utils/constants';


export default class ChecklistService {

  // ── TEMPLATE MANAGEMENT ────────────────────────────────────────────────────
  static async createTemplate(data: {school: string; level: 'msc' | 'phd'; stage: string; items: string[]; createdBy: string}) {
    const exists = await ChecklistTemplate.findOne({
      school: data.school,
      level:  data.level,
      stage:  data.stage,
    });
    if (exists) {
      throw new Error(`A template already exists for ${data.level} – ${data.stage}`);
    }

    const items = data.items.map((item) => ({
      label:    item,
    }));

    return ChecklistTemplate.create({
      school:    data.school,
      level:     data.level,
      stage:     data.stage,
      items,
      createdBy: new Types.ObjectId(data.createdBy),
    });
  }

  /**
   * Admin updates a template's title and/or items.
   * Note: updating items does NOT retroactively change already-assigned student checklists.
   */
  static async updateTemplate(templateId: string, items: string []) {
    const template = await ChecklistTemplate.findById(templateId) as any;
    if (!template) throw new Error('Template not found');

    if (items) {
      template.items = items.map((item) => ({
        label: item
      })) as any as typeof template.items;
    }

    return template.save();
  }
  /** Admin deletes a template. Cannot delete if student checklists exist for it. */
  static async deleteTemplate(templateId: string) {
    const template = await ChecklistTemplate.findById(templateId);
    if (!template) throw new Error('Template not found');

    const inUse = await StudentChecklist.exists({ template: templateId });
    if (inUse) {
      throw new Error(
        'Cannot delete template: student checklists have already been created from it'
      );
    }

    await template.deleteOne();
    return { deleted: true };
  }

  static async getTemplate(school: string, level: string, stage: string) {
    const template = await ChecklistTemplate.findOne({ school, level, stage });
    if (!template) throw new Error(`No checklist template found for ${level} – ${stage}`);
    return template;
  }

  static async getAllTemplates(school: string, level?: string) {
    const filter: Record<string, string> = { school };
    if (level) filter.level = level;
    return ChecklistTemplate.find(filter).sort({ level: 1, stage: 1 });
  }

  // ── STUDENT CHECKLIST INSTANCE ─────────────────────────────────────────────

  /**
   * Called when a student enters a new stage.
   * Creates a fresh checklist from the matching template.
   * Idempotent — safe to call more than once.
   */
  static async createStudentChecklist(studentId: string, stage: string, level: 'msc' | 'phd'): Promise<IStudentChecklist> {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    const template = await ChecklistTemplate.findOne({
      school: student.school,
      level:  level,
      stage,
    });
    if (!template) {
      throw new Error(`No checklist template found for ${student.level} – ${stage} in ${student.school}`);
    }

    // Idempotent: return existing checklist if already created
    const existing = await StudentChecklist.findOne({ student: studentId, stage, level });
    if (existing) return existing;

    const entries = (template as any).items.map((item: { label: any; required: any; }) => ({
      templateItemId: (item as any)._id, 
      label:    item.label,
      required: item.required,
      ticked:   false,
      tickedAt: null,
      tickedBy: null,
    }));

    return StudentChecklist.create({
      student:  new Types.ObjectId(studentId),
      template: template._id,
      school:   student.school,
      level:    level,
      stage,
      entries,
      allComplete:          false,
      approvedForNextStage: false,
    });
  }

  /**
   * pgadmin ticks or un-ticks a checklist item.
    * Automatically updates the allComplete flag based on required items.
   */
  static async tickItem(checklistId:string, templateItemId: string, tickedBy: string, ticked:boolean) {
    const checklist = await StudentChecklist.findById(checklistId);
    if (!checklist) throw new Error('Checklist not found');

    const entry = checklist.entries.find(
      (e) => e.templateItemId.toString() === templateItemId
    );
    if (!entry) throw new Error('Checklist item not found');

    entry.ticked   = ticked;
    entry.tickedAt = ticked ? new Date() : undefined;
    entry.tickedBy = ticked ? new Types.ObjectId(tickedBy) : undefined;

    checklist.allComplete = this.computeAllComplete(checklist);
    return checklist.save();
  }

  /**
   * pgadmin/supervisor approves a student to advance to the next stage.
   * All required items must be ticked before approval is granted.
   */
  static async approveForNextStage(checklistId: string, approvedBy: string) {
    const checklist = await StudentChecklist.findById(checklistId);
    if (!checklist) throw new Error('Checklist not found');

    const incomplete = checklist.entries.filter((e) => e.required && !e.ticked);
    if (incomplete.length > 0) {
      const labels = incomplete.map((e) => `"${e.label}"`).join(', ');
      throw new Error(
        `Cannot approve: the following required items are incomplete: ${labels}`
      );
    }

    checklist.approvedForNextStage = true;
    checklist.approvedBy  = new Types.ObjectId(approvedBy);
    checklist.approvedAt  = new Date();
    checklist.allComplete = true;
    await checklist.save();

    // === Move student to next stage ===
    const MSC_NEXT_STAGE: Record<string, string> = {
      [STAGES.MSC.START]:     STAGES.MSC.PROPOSAL,
      [STAGES.MSC.PROPOSAL]:  STAGES.MSC.INTERNAL,
      [STAGES.MSC.INTERNAL]:  STAGES.MSC.EXTERNAL,
      [STAGES.MSC.EXTERNAL]:  STAGES.MSC.COMPLETED,
    };

    const PHD_NEXT_STAGE: Record<string, string> = {
      [STAGES.PHD.START]:             STAGES.PHD.PROPOSAL_DEFENSE,
      [STAGES.PHD.PROPOSAL_DEFENSE]:  STAGES.PHD.SECOND_SEMINAR,
      [STAGES.PHD.SECOND_SEMINAR]:    STAGES.PHD.THIRD_SEMINAR,
      [STAGES.PHD.THIRD_SEMINAR]:     STAGES.PHD.EXTERNAL_DEFENCE,
      [STAGES.PHD.EXTERNAL_DEFENCE]:  STAGES.PHD.COMPLETED,
    };

    const nextStageMap = checklist.level === 'msc' ? MSC_NEXT_STAGE : PHD_NEXT_STAGE;
    const nextStage = nextStageMap[checklist.stage];

    if (!nextStage) throw new Error(`No next stage found for ${checklist.level} – ${checklist.stage}`);

    const student = await Student.findById(checklist.student);
    if (!student) throw new Error('Student not found');

    student.currentStage = nextStage;
    await student.save();

    return { checklist, student };
  }


  static async getStudentChecklist(studentId: string, stage: string) {
    const checklist = await StudentChecklist.findOne({ student: studentId, stage })
      .populate('template','title')
      .populate('approvedBy','firstName lastName');
    if (!checklist) throw new Error('No checklist found for this student and stage');
    return checklist;
  }

  static async getAllChecklistsForStudent(studentId: string) {
    return StudentChecklist.find({ student: studentId })
      .populate('template', 'title stage')
      .sort({ createdAt: 1 });
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────

  private static computeAllComplete(checklist: IStudentChecklist): boolean {
    return checklist.entries
      .filter((e) => e.required)
      .every((e) => e.ticked);
  }
}
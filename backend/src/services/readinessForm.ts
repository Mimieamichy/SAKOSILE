// services/readiness.service.ts
import { Types } from 'mongoose';
import ReadinessForm, { IReadinessForm, ReadinessFormTemplate } from '../models/readinessForm';
import { Student } from '../models/index';

export default class ReadinessFormService {
  static async createTemplate(data: {
    school: string;
    level: 'msc' | 'phd';
    stage: string;
    form: string;
    createdBy: string;
  }) {
    const exists = await ReadinessFormTemplate.findOne({
      school: data.school,
      level:  data.level,
      stage:  data.stage,
    });
    if (exists) {
      throw new Error(`A readiness form template already exists for ${data.level} – ${data.stage}`);
    }

    return ReadinessFormTemplate.create({
      school:    data.school,
      level:     data.level,
      stage:     data.stage,
      form:      data.form,
      createdBy: new Types.ObjectId(data.createdBy),
    });
  }

  static async updateTemplate(templateId: string, form: string) {
    const template = await ReadinessFormTemplate.findById(templateId);
    if (!template) throw new Error('Readiness form template not found');

    template.form = form;
    return template.save();
  }

  static async deleteTemplate(templateId: string) {
    const template = await ReadinessFormTemplate.findById(templateId);
    if (!template) throw new Error('Readiness form template not found');

    const inUse = await ReadinessForm.exists({ template: templateId });
    if (inUse) {
      throw new Error('Cannot delete template: readiness forms have already been assigned from it');
    }

    await template.deleteOne();
    return { deleted: true };
  }

  static async getTemplate(school: string, level: string, stage: string) {
    const template = await ReadinessFormTemplate.findOne({ school, level, stage });
    if (!template) throw new Error(`No readiness form template found for ${level} – ${stage}`);
    return template;
  }

  static async getAllTemplates(school: string, level?: string) {
    const filter: Record<string, string> = { school };
    if (level) filter.level = level;
    return ReadinessFormTemplate.find(filter).sort({ level: 1, stage: 1 });
  }

  static async assignReadinessForm(
    studentId: string,
    stage: string,
    level: 'msc' | 'phd'
  ): Promise<IReadinessForm> {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    const template = await ReadinessFormTemplate.findOne({
      school: student.school,
      level,
      stage,
    });
    if (!template) {
      throw new Error(`No readiness form template found for ${level} – ${stage} in ${student.school}`);
    }

    // Idempotent: return existing if already assigned
    const existing = await ReadinessForm.findOne({ student: studentId, stage });
    if (existing) return existing;

    return ReadinessForm.create({
      student:    new Types.ObjectId(studentId),
      template:   template._id,   // ✅ reference, not a copy
      school:     student.school,
      level,
      stage,
      department: student.department,
      faculty:    student.faculty,
      session:    student.session,
      submitted:  false,
    });
  }

  static async getStudentReadinessForm(studentId: string, stage: string) {
    const form = await ReadinessForm.findOne({ student: studentId, stage })
      .populate('template', 'form'); 
    if (!form) throw new Error('No readiness form found for this student and stage');
    return form;
  }

  static async getAllReadinessFormsForStudent(studentId: string) {
    return ReadinessForm.find({ student: studentId })
      .populate('template', 'form stage')
      .sort({ createdAt: 1 });
  }

  static async deleteStudentReadinessForm(formId: string) {
    const form = await ReadinessForm.findById(formId);
    if (!form) throw new Error('Readiness form not found');
    await form.deleteOne();
    return { deleted: true };
  }
}
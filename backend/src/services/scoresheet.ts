import { ScoreSheet, Lecturer, GeneralScoreSheet } from '../models/index';
import mongoose from 'mongoose';


export default class ScoreSheetService {
  static async createFacultyScoreSheet(criteria: { title: string; percentage: number }[], level: 'msc' | 'phd', stage: string, userId: string) {
    const formattedCriteria = criteria.map(c => ({
      name: c.title,
      weight: c.percentage
    }));

    const totalWeight = formattedCriteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.round(totalWeight) !== 100) {
      throw new Error('Criteria weights must add up to 100');
    }

    const lecturer = await Lecturer.findOne({user: userId});
    console.log(userId, lecturer)
    if (!lecturer || !lecturer.faculty) {
      throw new Error('Lecturer not found or faculty not assigned');
    }

    // deactivate current active one (if exists)
    await ScoreSheet.findOneAndUpdate(
    {
      faculty: lecturer.faculty,
      level,
      stage,
      isActive: true,
    },
    { isActive: false }
  );

    // create new active one
    const scoreSheet = await ScoreSheet.create({
      faculty: lecturer.faculty,
      level,
      stage,
      criteria: formattedCriteria,
      entries: [],
      isActive: true,
    });

    return scoreSheet;
  }

  static async getSingleFacultyScoreSheet(faculty: string, level: 'msc' | 'phd', stage: string) {
    const sheet = await ScoreSheet.findOne({faculty, level, stage, isActive: true});

    if (!sheet) {
      throw new Error('Active ScoreSheet not found');
    }

    return sheet;
  }

  static async getAllFacultyScoreSheets(faculty: string, level?: 'msc' | 'phd', stage?: string) {
    return await ScoreSheet.find({
      faculty,
      ...(level && { level }),
      ...(stage && { stage }),
    }).sort({ createdAt: -1 }); // latest first
  }

  static async UpdateCriterionFacultyScoreSheet(
    userId: string,
    criterionId: string,
    update: { name?: string; weight?: number }
  ) {
    const lecturer = await Lecturer.findOne({ user: userId });
    if (!lecturer || !lecturer.faculty) {
      throw new Error("Lecturer not found or faculty not set");
    }

    const scoreSheet = await ScoreSheet.findOne({ faculty: lecturer.faculty });
    if (!scoreSheet) {
      throw new Error("ScoreSheet not found for faculty");
    }

    const criterion = scoreSheet.criteria.find((c: any) => c._id.toString() === criterionId);
    if (!criterion) {
      throw new Error("Criterion not found");
    }

    if (update.name !== undefined) criterion.name = update.name;
    if (update.weight !== undefined) criterion.weight = update.weight;

    // validate sum
    const totalWeight = scoreSheet.criteria.reduce((sum, c: any) => sum + c.weight, 0);
    if (totalWeight !== 100) {
      throw new Error("Criteria weights must add up to 100");
    }

    await scoreSheet.save();
    return scoreSheet;
  }

  static async deleteCriterionFacultyScoreSheet(userId: string, criterionId: string) {
    const lecturer = await Lecturer.findOne({ user: userId });
    if (!lecturer || !lecturer.faculty) {
      throw new Error("Lecturer not found or faculty not set");
    }

    const scoreSheet = await ScoreSheet.findOne({ faculty: lecturer.faculty });
    if (!scoreSheet) {
      throw new Error("ScoreSheet not found for department");
    }

    const criterionIndex = scoreSheet.criteria.findIndex((c: any) => c._id.toString() === criterionId);
    if (criterionIndex === -1) {
      throw new Error("Criterion not found");
    }

    scoreSheet.criteria.splice(criterionIndex, 1);

    // validate sum
    const totalWeight = scoreSheet.criteria.reduce((sum, c: any) => sum + c.weight, 0);
    if (totalWeight !== 100 && scoreSheet.criteria.length > 0) {
      throw new Error("Criteria weights must add up to 100 after deletion");
    }

    await scoreSheet.save();
    return { success: true, deletedId: criterionId };
  }

  static async createGeneralScoreSheet(criteria: { name: string; weight: number }[]) {
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight !== 100) throw new Error("Criteria weights must add up to 100");

    const tempId = new mongoose.Types.ObjectId();


    const scoreSheet = await GeneralScoreSheet.create({
      defence: tempId,
      criteria,
      entries: [],
    });

    return scoreSheet;
  }

  static async updateGenCriterion(
    criterionId: string,
    update: { name?: string; weight?: number }
  ) {
    let scoreSheet = await GeneralScoreSheet.findOne();
    if (!scoreSheet) {
      throw new Error("General ScoreSheet not found");
    }

    const criterion = scoreSheet.criteria.find((c: any) => c._id.toString() === criterionId);
    if (!criterion) {
      throw new Error("Criterion not found");
    }

    if (update.name !== undefined) criterion.name = update.name;
    if (update.weight !== undefined) criterion.weight = update.weight;

    // validate sum
    const totalWeight = scoreSheet.criteria.reduce((sum, c: any) => sum + c.weight, 0);
    if (totalWeight !== 100) {
      throw new Error("Criteria weights must add up to 100");
    }

    await scoreSheet.save();
    return criterion;
  }


  static async getGenScoreSheet() {
    return await ScoreSheet.find()
  }

  static async deleteGenCriterion(criterionId: string) {
    let scoreSheet = await GeneralScoreSheet.findOne();
    if (!scoreSheet) {
      throw new Error("General ScoreSheet not found");
    }

    const criterionIndex = scoreSheet.criteria.findIndex((c: any) => c._id.toString() === criterionId);
    if (criterionIndex === -1) {
      throw new Error("Criterion not found");
    }

    scoreSheet.criteria.splice(criterionIndex, 1);

    // validate sum
    const totalWeight = scoreSheet.criteria.reduce((sum, c: any) => sum + c.weight, 0);
    if (totalWeight !== 100 && scoreSheet.criteria.length > 0) {
      throw new Error("Criteria weights must add up to 100 after deletion");
    }

    await scoreSheet.save();
    return criterionId;
  }

}
import { Institution } from '../models/index';

export default class FacultyService {
  static async getAllInstitutions() {
    return Institution.find();
  }
}

import { BaseRepository } from "./base.repository";
import { StudentProfileModel, IStudentProfileDocument } from "../models/student-profile.model";

export class StudentProfileRepository extends BaseRepository<IStudentProfileDocument> {
  constructor() {
    super(StudentProfileModel);
  }

  async findByUserId(userId: string): Promise<IStudentProfileDocument | null> {
    return this.findOne({ userId });
  }
}

export const studentProfileRepository = new StudentProfileRepository();

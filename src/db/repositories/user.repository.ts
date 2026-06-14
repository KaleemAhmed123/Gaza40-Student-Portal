import { BaseRepository } from "./base.repository";
import { UserModel, IUserDocument } from "../models/user.model";
import { StudentProfileModel } from "../models/student-profile.model";
import { VolunteerProfileModel } from "../models/volunteer-profile.model";
import { RegionalAdminProfileModel } from "../models/regional-admin-profile.model";

export class UserRepository extends BaseRepository<IUserDocument> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  async findWithProfiles(userId: string) {
    const user = await this.findById(userId);
    if (!user) return null;

    const [studentProfile, volunteerProfile, regionalAdminProfile] = await Promise.all([
      StudentProfileModel.findOne({ userId: user._id, deletedAt: null }).exec(),
      VolunteerProfileModel.findOne({ userId: user._id, deletedAt: null }).exec(),
      RegionalAdminProfileModel.findOne({ userId: user._id, deletedAt: null })
        .populate("regionId")
        .exec()
    ]);

    return {
      user,
      studentProfile,
      volunteerProfile,
      regionalAdminProfile
    };
  }
}

export const userRepository = new UserRepository();

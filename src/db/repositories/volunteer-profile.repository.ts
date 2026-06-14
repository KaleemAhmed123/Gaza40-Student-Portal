import { BaseRepository } from "./base.repository";
import { VolunteerProfileModel, IVolunteerProfileDocument } from "../models/volunteer-profile.model";

export class VolunteerProfileRepository extends BaseRepository<IVolunteerProfileDocument> {
  constructor() {
    super(VolunteerProfileModel);
  }

  async findByUserId(userId: string): Promise<IVolunteerProfileDocument | null> {
    return this.findOne({ userId });
  }
}

export const volunteerProfileRepository = new VolunteerProfileRepository();

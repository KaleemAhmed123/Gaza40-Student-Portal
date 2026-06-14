import { BaseRepository } from "./base.repository";
import { RegionalAdminProfileModel, IRegionalAdminProfileDocument } from "../models/regional-admin-profile.model";

export class RegionalAdminProfileRepository extends BaseRepository<IRegionalAdminProfileDocument> {
  constructor() {
    super(RegionalAdminProfileModel);
  }

  async findByUserId(userId: string): Promise<IRegionalAdminProfileDocument | null> {
    return this.findOne({ userId });
  }
}

export const regionalAdminProfileRepository = new RegionalAdminProfileRepository();

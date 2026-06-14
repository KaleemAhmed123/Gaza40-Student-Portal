import { BaseRepository } from "./base.repository";
import { RegionModel, IRegionDocument } from "../models/region.model";

export class RegionRepository extends BaseRepository<IRegionDocument> {
  constructor() {
    super(RegionModel);
  }

  async findActive(): Promise<IRegionDocument[]> {
    return this.find({ isActive: true });
  }

  async findByCode(code: string): Promise<IRegionDocument | null> {
    return this.findOne({ code: code.toUpperCase() });
  }
}

export const regionRepository = new RegionRepository();

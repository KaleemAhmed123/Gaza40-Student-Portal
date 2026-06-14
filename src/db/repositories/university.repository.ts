import { BaseRepository } from "./base.repository";
import { UniversityModel, IUniversityDocument } from "../models/university.model";

export class UniversityRepository extends BaseRepository<IUniversityDocument> {
  constructor() {
    super(UniversityModel);
  }

  async findUnique(regionId: string, name: string): Promise<IUniversityDocument | null> {
    return this.findOne({ regionId, name });
  }

  async findActiveByRegion(regionId?: string, search?: string): Promise<IUniversityDocument[]> {
    const filter: any = { isActive: true };
    if (regionId) {
      filter.regionId = regionId;
    }
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    return this.find(filter, { sort: { name: 1 }, limit: 50, populate: "regionId" });
  }
}

export const universityRepository = new UniversityRepository();

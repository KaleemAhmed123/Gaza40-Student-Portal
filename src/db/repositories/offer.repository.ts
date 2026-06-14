import { BaseRepository } from "./base.repository";
import { OfferModel, IOfferDocument } from "../models/offer.model";

export class OfferRepository extends BaseRepository<IOfferDocument> {
  constructor() {
    super(OfferModel);
  }

  async findStudentOffers(studentUserId: string): Promise<IOfferDocument[]> {
    return this.find({ studentUserId }, { populate: ["regionId", "universityId", "mentorId"] });
  }

  async findWithRelations(id: string): Promise<IOfferDocument | null> {
    return this.findOne({ _id: id }, ["regionId", "universityId", "mentorId"]);
  }
}

export const offerRepository = new OfferRepository();

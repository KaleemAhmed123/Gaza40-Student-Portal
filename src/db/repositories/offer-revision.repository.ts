import { BaseRepository } from "./base.repository";
import { OfferRevisionModel, IOfferRevisionDocument } from "../models/offer-revision.model";

export class OfferRevisionRepository extends BaseRepository<IOfferRevisionDocument> {
  constructor() {
    super(OfferRevisionModel);
  }

  async findByOfferId(offerId: string): Promise<IOfferRevisionDocument[]> {
    return this.find({ offerId }, { sort: { createdAt: -1 }, populate: "editedBy" });
  }
}

export const offerRevisionRepository = new OfferRevisionRepository();

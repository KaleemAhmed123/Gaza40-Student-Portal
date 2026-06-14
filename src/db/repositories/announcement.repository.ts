import { BaseRepository } from "./base.repository";
import { AnnouncementModel, IAnnouncementDocument } from "../models/announcement.model";

export class AnnouncementRepository extends BaseRepository<IAnnouncementDocument> {
  constructor() {
    super(AnnouncementModel);
  }

  async findPublished(): Promise<IAnnouncementDocument[]> {
    return this.find(
      { isPublished: true },
      { sort: { publishedAt: -1, createdAt: -1 }, populate: "createdByUserId" }
    );
  }
}

export const announcementRepository = new AnnouncementRepository();

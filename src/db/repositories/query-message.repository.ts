import { BaseRepository } from "./base.repository";
import { QueryMessageModel, IQueryMessageDocument } from "../models/query-message.model";

export class QueryMessageRepository extends BaseRepository<IQueryMessageDocument> {
  constructor() {
    super(QueryMessageModel);
  }

  async findByQueryId(queryId: string): Promise<IQueryMessageDocument[]> {
    return this.find({ queryId }, { sort: { createdAt: 1 }, populate: "senderUserId" });
  }
}

export const queryMessageRepository = new QueryMessageRepository();

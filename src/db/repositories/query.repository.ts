import { BaseRepository } from "./base.repository";
import { QueryModel, IQueryDocument } from "../models/query.model";

export class QueryRepository extends BaseRepository<IQueryDocument> {
  constructor() {
    super(QueryModel);
  }

  async findWithRelations(id: string): Promise<IQueryDocument | null> {
    return this.findOne({ _id: id }, ["studentUserId", "offerId", "regionId", "assignedToUserId", "assignedByUserId"]);
  }
}

export const queryRepository = new QueryRepository();

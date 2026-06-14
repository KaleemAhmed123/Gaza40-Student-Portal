import { BaseRepository } from "./base.repository";
import { AuditLogModel, IAuditLogDocument } from "../models/audit-log.model";

export class AuditLogRepository extends BaseRepository<IAuditLogDocument> {
  constructor() {
    super(AuditLogModel);
  }
}

export const auditLogRepository = new AuditLogRepository();

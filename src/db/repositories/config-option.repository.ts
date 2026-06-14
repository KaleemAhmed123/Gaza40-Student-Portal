import { BaseRepository } from "./base.repository";
import { ConfigOptionModel, IConfigOptionDocument } from "../models/config-option.model";

export class ConfigOptionRepository extends BaseRepository<IConfigOptionDocument> {
  constructor() {
    super(ConfigOptionModel);
  }

  async findActiveByGroup(groupKey: string): Promise<IConfigOptionDocument[]> {
    return this.find(
      { groupKey, isActive: true },
      { sort: { sortOrder: 1, labelEn: 1 } }
    );
  }
}

export const configOptionRepository = new ConfigOptionRepository();

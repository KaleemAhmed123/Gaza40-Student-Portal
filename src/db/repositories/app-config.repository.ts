import { BaseRepository } from "./base.repository";
import { AppConfigModel, IAppConfigDocument } from "../models/app-config.model";

export class AppConfigRepository extends BaseRepository<IAppConfigDocument> {
  constructor() {
    super(AppConfigModel);
  }

  async findByKey(key: string): Promise<IAppConfigDocument | null> {
    return this.findOne({ key });
  }
}

export const appConfigRepository = new AppConfigRepository();

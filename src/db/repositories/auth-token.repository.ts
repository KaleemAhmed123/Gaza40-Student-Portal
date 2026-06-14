import { BaseRepository } from "./base.repository";
import { AuthTokenModel, IAuthTokenDocument } from "../models/auth-token.model";
import { AuthTokenType } from "../models/enums";

export class AuthTokenRepository extends BaseRepository<IAuthTokenDocument> {
  constructor() {
    super(AuthTokenModel);
  }

  async findActiveToken(tokenHash: string, type: AuthTokenType): Promise<IAuthTokenDocument | null> {
    return this.findOne(
      {
        tokenHash,
        type,
        usedAt: null,
        expiresAt: { $gt: new Date() }
      },
      "userId"
    );
  }

  async invalidatePreviousTokens(userId: string, type: AuthTokenType): Promise<void> {
    await this.updateMany(
      {
        userId,
        type,
        usedAt: null,
        expiresAt: { $gt: new Date() }
      },
      {
        usedAt: new Date()
      }
    );
  }
}

export const authTokenRepository = new AuthTokenRepository();

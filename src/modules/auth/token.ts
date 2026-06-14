import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { RoleCode } from "../../db/models/enums";
import { env } from "../../config/env";
import type { AuthUser } from "../../middleware/auth.middleware";

type AccessTokenPayload = {
  sub: string;
  email: string;
  roles: RoleCode[];
};

export function signAccessToken(user: AuthUser) {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    roles: user.roles
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

  return {
    id: decoded.sub,
    email: decoded.email,
    roles: decoded.roles
  };
}

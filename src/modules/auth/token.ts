import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { RoleCode } from "@prisma/client";
import { env } from "../../config/env";
import type { AuthUser } from "../../middleware/auth.middleware";

type AccessTokenPayload = {
  sub: string;
  email: string;
  roles: RoleCode[];
  regionId?: string;
};

export function signAccessToken(user: AuthUser) {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    roles: user.roles,
    regionId: user.regionId
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
    roles: decoded.roles,
    regionId: decoded.regionId
  };
}

export function signRefreshToken(user: AuthUser) {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    roles: user.roles,
    regionId: user.regionId
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]
  });
}

export function verifyRefreshToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessTokenPayload;

  return {
    id: decoded.sub,
    email: decoded.email,
    roles: decoded.roles,
    regionId: decoded.regionId
  };
}

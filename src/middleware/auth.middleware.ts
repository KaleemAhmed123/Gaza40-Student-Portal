import type { NextFunction, Request, Response } from "express";
import type { RoleCode } from "@prisma/client";
import { prisma } from "../db/prisma";
import { ApiError } from "../shared/http";
import { verifyAccessToken } from "../modules/auth/token";

export type AuthUser = {
  id: string;
  email: string;
  roles: RoleCode[];
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken;

  if (!token) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  try {
    req.authUser = verifyAccessToken(token);
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired authentication token"));
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    const hasRole = req.authUser.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      next(new ApiError(403, "You do not have permission to access this resource"));
      return;
    }

    next();
  };
}

export function requireActiveDbRole(roleCode: RoleCode) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    prisma.user
      .findFirst({
        where: {
          id: req.authUser.id,
          deletedAt: null,
          accountStatus: "active",
          roles: { has: roleCode }
        }
      })
      .then((activeUser) => {
        if (!activeUser) {
          next(new ApiError(403, "You do not have permission to access this resource"));
          return;
        }

        next();
      })
      .catch(next);
  };
}

import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../shared/http";

export function requireCsrfHeader(req: Request, _res: Response, next: NextFunction) {
  // Allow GET, HEAD, OPTIONS without CSRF token since they shouldn't mutate state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const requestedWith = req.headers['x-requested-with'];
  if (!requestedWith || requestedWith !== 'XMLHttpRequest') {
    return next(new ApiError(403, "CSRF validation failed: Missing or invalid x-requested-with header"));
  }

  next();
}

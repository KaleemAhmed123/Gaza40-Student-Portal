import rateLimit from "express-rate-limit";
import { env } from "../config/env";

function createRateLimiter(max: number, message: string) {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        message
      }
    }
  });
}

export const apiRateLimiter = createRateLimiter(
  env.RATE_LIMIT_MAX,
  "Too many requests. Please try again later."
);

export const authRateLimiter = createRateLimiter(
  env.AUTH_RATE_LIMIT_MAX,
  "Too many auth attempts. Please try again later."
);

export const uploadRateLimiter = createRateLimiter(
  env.UPLOAD_RATE_LIMIT_MAX,
  "Too many upload attempts. Please try again later."
);

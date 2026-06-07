import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { listMentorOffersHandler, reviewMentorOfferHandler } from "./mentor-offer.controller";

export const mentorOfferRouter = Router();

mentorOfferRouter.use(requireAuth);

// GET /api/mentor/offers - List all offers assigned to the logged-in mentor
mentorOfferRouter.get("/", listMentorOffersHandler);

// PATCH /api/mentor/offers/:id/review - Review an offer (assigned mentor only)
mentorOfferRouter.patch("/:id/review", reviewMentorOfferHandler);

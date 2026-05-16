import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import {
  createMyOfferHandler,
  getMyOfferHandler,
  listMyOffersHandler,
  removeMyOfferHandler,
  submitMyOfferHandler,
  updateMyOfferHandler
} from "./student-offer.controller";

export const studentOfferRouter = Router();

studentOfferRouter.use(requireAuth, requireRole(["student"]));
studentOfferRouter.get("/", listMyOffersHandler);
studentOfferRouter.post("/", createMyOfferHandler);
studentOfferRouter.get("/:id", getMyOfferHandler);
studentOfferRouter.patch("/:id", updateMyOfferHandler);
studentOfferRouter.delete("/:id", removeMyOfferHandler);
studentOfferRouter.post("/:id/submit", submitMyOfferHandler);

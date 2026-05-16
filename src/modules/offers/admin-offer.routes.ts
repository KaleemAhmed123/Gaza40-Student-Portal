import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  getAdminOfferHandler,
  listAdminOffersHandler,
  reviewOfferHandler
} from "./admin-offer.controller";

export const adminOfferRouter = Router();

adminOfferRouter.use(requireAuth);
adminOfferRouter.get("/", listAdminOffersHandler);
adminOfferRouter.get("/:id", getAdminOfferHandler);
adminOfferRouter.patch("/:id/review", reviewOfferHandler);

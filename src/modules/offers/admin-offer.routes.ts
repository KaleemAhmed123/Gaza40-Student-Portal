import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  exportAdminOffersHandler,
  getAdminOfferHandler,
  getAdminOfferRevisionsHandler,
  listAdminOffersHandler,
  reviewOfferHandler
} from "./admin-offer.controller";

export const adminOfferRouter = Router();

adminOfferRouter.use(requireAuth);
adminOfferRouter.get("/export", exportAdminOffersHandler);
adminOfferRouter.get("/", listAdminOffersHandler);
adminOfferRouter.get("/:id/revisions", getAdminOfferRevisionsHandler);
adminOfferRouter.get("/:id", getAdminOfferHandler);
adminOfferRouter.patch("/:id/review", reviewOfferHandler);

import { RoleCode } from "@prisma/client";
import { Router } from "express";
import { requireActiveDbRole, requireAuth } from "../../middleware/auth.middleware";
import {
  createConfigOptionHandler,
  createRegionHandler,
  createUniversityHandler,
  deactivateConfigOptionHandler,
  deactivateRegionHandler,
  deactivateUniversityHandler,
  listAllRegionsAdminHandler,
  listAllUniversitiesAdminHandler,
  listConfigOptionsHandler,
  listRegionsHandler,
  listUniversitiesHandler,
  updateConfigOptionHandler,
  updateRegionHandler,
  updateUniversityHandler
} from "./config.controller";

export const configRouter = Router();
export const adminConfigRouter = Router();

configRouter.get("/regions", listRegionsHandler);
configRouter.get("/universities", listUniversitiesHandler);
configRouter.get("/options", listConfigOptionsHandler);

adminConfigRouter.use(requireAuth, requireActiveDbRole(RoleCode.master_admin));
adminConfigRouter.get("/regions", listAllRegionsAdminHandler);
adminConfigRouter.get("/universities", listAllUniversitiesAdminHandler);
adminConfigRouter.post("/options", createConfigOptionHandler);
adminConfigRouter.patch("/options/:id", updateConfigOptionHandler);
adminConfigRouter.delete("/options/:id", deactivateConfigOptionHandler);
adminConfigRouter.post("/regions", createRegionHandler);
adminConfigRouter.patch("/regions/:id", updateRegionHandler);
adminConfigRouter.delete("/regions/:id", deactivateRegionHandler);
adminConfigRouter.post("/universities", createUniversityHandler);
adminConfigRouter.patch("/universities/:id", updateUniversityHandler);
adminConfigRouter.delete("/universities/:id", deactivateUniversityHandler);

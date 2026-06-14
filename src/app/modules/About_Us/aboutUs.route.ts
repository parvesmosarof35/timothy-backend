import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { AboutUsController } from "./aboutUs.controller";
import { aboutUsValidation } from "./aboutUs.validation";

const router = express.Router();

// Get about us
router.get(
  "/",
  AboutUsController.getAboutUs
);

// Create or update about us
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(aboutUsValidation.createAboutUsSchema),
  AboutUsController.createOrUpdateAboutUs
);

export const aboutUsRoute = router;

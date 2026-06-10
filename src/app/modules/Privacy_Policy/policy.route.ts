import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { PrivacyController } from "./policy.controller";
import { privacyPolicyValidation } from "./policy.validation";

const router = express.Router();

// Get privacy policy
router.get(
  "/",
  PrivacyController.getPolicy
);

// Create or update privacy policy
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(privacyPolicyValidation.createPrivacyPolicySchema),
  PrivacyController.createOrUpdatePolicy
);

export const privacyPolicyRoute = router;

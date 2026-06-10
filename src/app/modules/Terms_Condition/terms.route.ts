import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { TermsController } from "./terms.controller";
import { termsConditionValidation } from "./terms.validation";

const router = express.Router();

// Get terms and conditions
router.get(
  "/",
  TermsController.getTerms
);

// Create or update terms and conditions
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(termsConditionValidation.termsConditionSchema),
  TermsController.createOrUpdateTerms
);

export const termsConditionRoute = router;

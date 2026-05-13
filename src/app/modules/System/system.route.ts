import express from "express";
import { SystemController } from "./system.controller";

const router = express.Router();

router.get("/stats", SystemController.getSystemStats);

export const SystemRoutes = router;

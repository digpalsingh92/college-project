import express from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { getPatientsController } from "../controllers/patient.controller.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("admin", "doctor"), asyncHandler(getPatientsController));

export default router;

import express from "express";
import { getDoctorSlotRecommendationsController } from "../controllers/recommendation.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = express.Router();

router.get("/:doctorId/recommend-slots", optionalAuth, asyncHandler(getDoctorSlotRecommendationsController));

export default router;

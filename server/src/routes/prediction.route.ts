import express from "express";
import {
  reloadPredictionModelController,
  resourceAllocationPredictionController,
  trainPredictionModelController,
  waitingTimePredictionController,
} from "../controllers/prediction.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/train",
  requireAuth,
  requireRole("admin"),
  asyncHandler(trainPredictionModelController)
);
router.post(
  "/reload",
  requireAuth,
  requireRole("admin"),
  asyncHandler(reloadPredictionModelController)
);
router.post("/waiting-time", asyncHandler(waitingTimePredictionController));
router.post("/resource-allocation", asyncHandler(resourceAllocationPredictionController));

export default router;

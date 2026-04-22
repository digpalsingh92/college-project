import express from "express";
import {
  reloadPredictionModelController,
  resourceAllocationPredictionController,
  trainPredictionModelController,
  waitingTimePredictionController,
  slotsAnalysisController,
  noShowPredictionController,
  surgeryPlanController,
  priceEstimationController,
  bedAvailabilityController,
  queueStatusController,
  recommendationsController,
  trainNoShowController,
  trainPriceController,
  trainBedController,
  trainDiseaseController,
  diseasePredictionController,
} from "../controllers/prediction.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Training routes (admin only) ──
router.post("/train", requireAuth, requireRole("admin"), asyncHandler(trainPredictionModelController));
router.post("/train/no-show", requireAuth, requireRole("admin"), asyncHandler(trainNoShowController));
router.post("/train/price", requireAuth, requireRole("admin"), asyncHandler(trainPriceController));
router.post("/train/bed", requireAuth, requireRole("admin"), asyncHandler(trainBedController));
router.post("/train/disease", requireAuth, requireRole("admin"), asyncHandler(trainDiseaseController));
router.post("/reload", requireAuth, requireRole("admin"), asyncHandler(reloadPredictionModelController));

// ── Existing prediction routes ──
router.post("/waiting-time", asyncHandler(waitingTimePredictionController));
router.post("/resource-allocation", asyncHandler(resourceAllocationPredictionController));

// ── New prediction routes ──
router.get("/slots-analysis", requireAuth, asyncHandler(slotsAnalysisController));
router.post("/no-show", asyncHandler(noShowPredictionController));
router.post("/surgery-plan", asyncHandler(surgeryPlanController));
router.post("/price-estimation", asyncHandler(priceEstimationController));
router.post("/bed-availability", asyncHandler(bedAvailabilityController));
router.post("/disease", asyncHandler(diseasePredictionController));
router.get("/queue-status", requireAuth, asyncHandler(queueStatusController));
router.get("/recommendations", asyncHandler(recommendationsController));

export default router;

import express from "express";
import {
  getAdminAppointmentInsightsController,
  getPredictedSlotsController,
  createAppointmentController,
  getPatientAppointmentsController,
  getDoctorAppointmentsController,
  cancelAppointmentController,
  completeAppointmentController,
  updateAppointmentByDoctorController,
} from "../controllers/appointment.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// Patient endpoints
router.get("/my", requireAuth, requireRole("patient"), asyncHandler(getPatientAppointmentsController));
router.get("/slots", requireAuth, asyncHandler(getPredictedSlotsController));
router.post("/", requireAuth, requireRole("patient"), asyncHandler(createAppointmentController));
router.patch("/:id/cancel", requireAuth, asyncHandler(cancelAppointmentController));

// Admin endpoint
router.get(
  "/admin/insights",
  requireAuth,
  requireRole("admin"),
  asyncHandler(getAdminAppointmentInsightsController)
);

// Doctor endpoints
router.get("/doctor/my", requireAuth, requireRole("doctor"), asyncHandler(getDoctorAppointmentsController));
router.patch("/:id/complete", requireAuth, requireRole("doctor"), asyncHandler(completeAppointmentController));
router.patch("/:id/doctor-update", requireAuth, requireRole("doctor"), asyncHandler(updateAppointmentByDoctorController));

export default router;

import express from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import {
  addDoctorUnavailabilityController,
  createDoctorScheduleController,
  deleteDoctorScheduleController,
  deleteDoctorUnavailabilityController,
  getDoctorAvailabilityController,
  getDoctorSchedulesController,
  getDoctorUnavailabilitiesController,
  updateDoctorScheduleController,
} from "../controllers/schedule.controller.js";
import {
  getAllDoctorsController,
  getDoctorAnalyticsController,
  getDoctorByIdController,
  getDoctorProfileController,
} from "../controllers/doctor.controller.js";

const router = express.Router();

// Public: list all doctors & get one by ID
router.get("/", asyncHandler(getAllDoctorsController));
router.get("/analytics", requireAuth, requireRole("admin"), asyncHandler(getDoctorAnalyticsController));
router.get("/me", requireAuth, requireRole("doctor"), asyncHandler(getDoctorProfileController));
router.get("/:id", asyncHandler(getDoctorByIdController));

// Doctor schedule endpoints
router.post("/schedules", requireAuth, requireRole("doctor"), asyncHandler(createDoctorScheduleController));
router.get("/:doctorId/schedules", requireAuth, requireRole("doctor"), asyncHandler(getDoctorSchedulesController));
router.put("/schedules/:scheduleId", requireAuth, requireRole("doctor"), asyncHandler(updateDoctorScheduleController));
router.delete("/schedules/:scheduleId", requireAuth, requireRole("doctor"), asyncHandler(deleteDoctorScheduleController));

// Unavailability endpoints
router.post("/unavailability", requireAuth, requireRole("doctor"), asyncHandler(addDoctorUnavailabilityController));
router.get("/:doctorId/unavailability", requireAuth, requireRole("doctor"), asyncHandler(getDoctorUnavailabilitiesController));
router.delete("/unavailability/:unavailabilityId", requireAuth, requireRole("doctor"), asyncHandler(deleteDoctorUnavailabilityController));

// Availability query
router.get("/:doctorId/availability", asyncHandler(getDoctorAvailabilityController));

export default router;

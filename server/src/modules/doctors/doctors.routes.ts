import express from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validate-request.middleware.js";
import { registerDoctorSchema, loginSchema, createScheduleSchema, upsertUnavailabilitySchema } from "./doctors.schemas.js";
import {
  doctorRegister,
  doctorLogin,
  getDoctorProfileController,
  getAllDoctorsController,
  getDoctorByIdController,
  getDoctorAnalyticsController,
  createDoctorScheduleController,
  getDoctorSchedulesController,
  updateDoctorScheduleController,
  deleteDoctorScheduleController,
  addDoctorUnavailabilityController,
  getDoctorUnavailabilitiesController,
  deleteDoctorUnavailabilityController,
  getDoctorAvailabilityController,
} from "./doctors.controller.js";

const router = express.Router();

// Auth
router.post("/auth/register", validateRequest({ body: registerDoctorSchema }), asyncHandler(doctorRegister));
router.post("/auth/login", validateRequest({ body: loginSchema }), asyncHandler(doctorLogin));

// Doctor schedules & unavailability endpoints
router.post("/schedules", requireAuth, requireRole("doctor"), validateRequest({ body: createScheduleSchema }), asyncHandler(createDoctorScheduleController));
router.put("/schedules/:scheduleId", requireAuth, requireRole("doctor"), asyncHandler(updateDoctorScheduleController));
router.delete("/schedules/:scheduleId", requireAuth, requireRole("doctor"), asyncHandler(deleteDoctorScheduleController));

router.post("/unavailability", requireAuth, requireRole("doctor"), validateRequest({ body: upsertUnavailabilitySchema }), asyncHandler(addDoctorUnavailabilityController));
router.delete("/unavailability/:unavailabilityId", requireAuth, requireRole("doctor"), asyncHandler(deleteDoctorUnavailabilityController));

// Metadata & analytics (placed before fuzzy id parameters)
router.get("/analytics", requireAuth, requireRole("admin"), asyncHandler(getDoctorAnalyticsController));
router.get("/me", requireAuth, requireRole("doctor"), asyncHandler(getDoctorProfileController));

// Availability checking
router.get("/:doctorId/availability", asyncHandler(getDoctorAvailabilityController));
router.get("/:doctorId/schedules", requireAuth, asyncHandler(getDoctorSchedulesController));
router.get("/:doctorId/unavailability", requireAuth, asyncHandler(getDoctorUnavailabilitiesController));

// Dynamic lookups
router.get("/:doctorId", asyncHandler(getDoctorByIdController));
router.get("/", asyncHandler(getAllDoctorsController));

export default router;

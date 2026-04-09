import express from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import {
  addDoctorUnavailabilityController,
  createDoctorScheduleController,
  getDoctorAvailabilityController,
} from "../controllers/schedule.controller.js";
import {
  getAllDoctorsController,
  getDoctorByIdController,
  getDoctorProfileController,
} from "../controllers/doctor.controller.js";

const router = express.Router();

// Public: list all doctors & get one by ID
router.get("/", asyncHandler(getAllDoctorsController));
router.get("/me", requireAuth, requireRole("doctor"), asyncHandler(getDoctorProfileController));
router.get("/:id", asyncHandler(getDoctorByIdController));

// Doctor schedule endpoints
router.post("/schedules", requireAuth, requireRole("doctor"), asyncHandler(createDoctorScheduleController));
router.post("/unavailability", requireAuth, requireRole("doctor"), asyncHandler(addDoctorUnavailabilityController));
router.get("/:doctorId/availability", requireRole("doctor"), asyncHandler(getDoctorAvailabilityController));

export default router;

import express from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validate-request.middleware.js";
import { registerPatientSchema, loginSchema } from "./users.schemas.js";
import {
  patientRegister,
  patientLogin,
  adminLogin,
  getPatientsController,
  refreshTokenController,
  logoutController,
} from "./users.controller.js";

const authRouter = express.Router();
authRouter.post("/register", validateRequest({ body: registerPatientSchema }), asyncHandler(patientRegister));
authRouter.post("/login", validateRequest({ body: loginSchema }), asyncHandler(patientLogin));
authRouter.post("/admin/login", validateRequest({ body: loginSchema }), asyncHandler(adminLogin));
authRouter.post("/refresh", asyncHandler(refreshTokenController));
authRouter.post("/logout", requireAuth, asyncHandler(logoutController));

const patientRouter = express.Router();
patientRouter.get("/", requireAuth, requireRole("admin"), asyncHandler(getPatientsController));

export { authRouter, patientRouter };

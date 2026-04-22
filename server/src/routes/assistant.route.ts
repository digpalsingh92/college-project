import express from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { askAssistantController } from "../controllers/assistant.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", requireAuth, asyncHandler(askAssistantController));

export default router;

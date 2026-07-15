import express from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { askAssistantController } from "./assistant.controller.js";

const router = express.Router();

router.post("/", asyncHandler(askAssistantController));

export default router;

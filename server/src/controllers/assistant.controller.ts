import { Request, Response } from "express";
import { handleUserQuery } from "../ml/assistant/orchestrator.js";

export const askAssistantController = async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    res.status(400).json({
      intent: "unknown",
      message: "A valid message string is required.",
      data: null,
      confidence: 0,
      suggestions: ["Ask about surgery cost", "Ask about a disease", "Check bed availability"],
    });
    return;
  }

  // Extract userId from authenticated user (set by requireAuth middleware)
  const userId = req.user?.id ?? "anonymous";

  console.log(`[Assistant] user=${userId} query="${message}"`);

  const result = await handleUserQuery(message, userId);

  res.status(200).json(result);
};

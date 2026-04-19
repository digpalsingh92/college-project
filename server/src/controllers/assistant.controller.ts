import { Request, Response } from "express";

export const askAssistantController = async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    res.status(400).json({ success: false, message: "Valid message string is required." });
    return;
  }

  const lowered = message.toLowerCase();

  // Simple keyword matching for demo logic
  if (lowered.includes("cost") || lowered.includes("price") || lowered.includes("fee")) {
    res.status(200).json({
      success: true,
      type: "price",
      data: {
        priceRange: "₹20K – ₹40K",
      },
    });
    return;
  }

  if (lowered.includes("wait") || lowered.includes("long") || lowered.includes("time")) {
    res.status(200).json({
      success: true,
      type: "wait-time",
      data: {
        waitTime: "3 days",
      },
    });
    return;
  }

  if (lowered.includes("bed") || lowered.includes("room")) {
    res.status(200).json({
      success: true,
      type: "bed",
      data: {
        bedsAvailable: "Available (12 open)",
      },
    });
    return;
  }

  // Fallback response
  res.status(200).json({
    success: true,
    type: "general",
    message: "I am an AI assistant integrated with the hospital systems. How can I help you today?",
  });
};

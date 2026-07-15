import { Request, Response } from "express";
import { HumanMessage } from "@langchain/core/messages";
import { agent } from "../../ml/agent.js";

export const askAssistantController = async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    res.status(400).json({ success: false, message: "Valid message string is required." });
    return;
  }

  // Use the authenticated user's ID as the session thread ID for LangGraph memory persistence
  const threadId = req.user?.id || "default-session";

  try {
    const responseState = await agent.invoke(
      {
        messages: [new HumanMessage({ content: message })],
      },
      {
        configurable: {
          thread_id: threadId,
        },
      }
    );

    const messages = responseState.messages;
    console.log("TRAJECTORY MESSAGES:", JSON.stringify(messages.map(m => ({ type: m._getType(), content: m.content, tool_calls: (m as any).tool_calls })), null, 2));
    const finalReply = messages[messages.length - 1]?.content || "I'm not sure how to reply to that.";
    const structuredData = responseState.data || {};

    res.status(200).json({
      success: true,
      message: typeof finalReply === "string" ? finalReply : JSON.stringify(finalReply),
      data: structuredData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `AI assistant error: ${error.message || error}`,
    });
  }
};

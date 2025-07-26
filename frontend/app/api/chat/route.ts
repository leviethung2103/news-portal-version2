import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Create an OpenAI provider instance
const openai = createOpenAI({
  // Configure with OpenAI as default or fallback to xAI
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY || process.env.XAI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: openai("gpt-4.1-nano"), // Use OpenAI as default
      messages,
      system: `You are a helpful AI assistant integrated into a news portal dashboard. 
               You can help users with:
               - Answering questions about current events and news
               - Providing productivity tips and planning assistance
               - General conversation and support
               - Explaining features of the news portal application
               
               Be friendly, helpful, and concise in your responses.`,
      maxTokens: 500,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Error processing chat request", { status: 500 });
  }
}

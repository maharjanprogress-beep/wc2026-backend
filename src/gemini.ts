import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) throw new Error("GEMINI_API_KEY must be set");

export const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
    maxOutputTokens: 4096,
  },
  systemInstruction:
    "You are a football analytics expert. Always respond with valid JSON only, no markdown, no extra text.",
});

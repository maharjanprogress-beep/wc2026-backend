import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

if (!apiKey) throw new Error("OPENAI_API_KEY must be set");

export const openai = new OpenAI({ apiKey, baseURL });

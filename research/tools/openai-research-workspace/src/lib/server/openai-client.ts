import OpenAI from "openai";
import { getRequiredEnv } from "./config";

let client: OpenAI | undefined;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: getRequiredEnv("OPENAI_API_KEY"),
    });
  }

  return client;
}
